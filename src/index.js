/* @flow */

import { map, all, any, filter, reduce, concat } from 'ramda'

/* Types */

type Indexical = number
type Weight = number
type WeightedEdge = [Indexical, Weight]

type RowVector<T> = T[]
type Matrix<T> = RowVector<T>[]

export type DiGraph = Matrix<Indexical>
export type WeightedDiGraph = Matrix<WeightedEdge>
export type Mapping = Matrix<Indexical>
export type Isomorphism = Indexical[]

/* Utility */

export const flatmap = <T,R>(fn: (x:T) => Array<R>, xs: Array<T>): Array<R> =>
reduce(concat, [], map(fn, xs))

/* Adjacency list graph representation */

const getIndex = ([index, weight]: WeightedEdge): number => index
const getWeight = ([index, weight]: WeightedEdge): number => weight
const weightOneEdge = (index: number): WeightedEdge => [index, 1]
const digraphToWeighted = (graph: DiGraph): WeightedDiGraph => map(
  (neighbors) => map(
    (neighborIndex) => weightOneEdge(neighborIndex),
    neighbors
  ),
  graph
)

// In the directed graph `graph`, does `vertex` have an edge to `neighbor`?
const isAdjacent = <T>(
  graph: Matrix<T>,
  accessIndex: (x: T) => number,
  adjacencyPred: (edge: T, neighborIndex: number) => boolean,
  vertex: number,
  neighbor: number
): boolean =>
{
  for (let i = 0; i < graph[vertex].length; i++) {
    if (accessIndex(graph[vertex][i]) > neighbor) return false // NOTE: adjacency list must be sorted ascending
    if (adjacencyPred(graph[vertex][i], neighbor)) return true
  }
  return false
}

/* Ullman */

export const extractAtMostOneIsomorphism = (
  pattern: WeightedDiGraph,
  target: WeightedDiGraph,
  mapping: Mapping
): Isomorphism[] => {
  const mappedTargetVertex = (patternVertex: number): number | null =>
  mapping[patternVertex].length === 1
  ? mapping[patternVertex][0]
  : null

  let iso: Isomorphism = []

  for (let patternVertex = 0; patternVertex < pattern.length; patternVertex++) {
    let correspondingTargetVertex = mappedTargetVertex(patternVertex)
    if (correspondingTargetVertex === null) return []
    let patternVector = pattern[patternVertex]
    for (let j = 0; j < patternVector.length; j++) {
      let [patternNeighbor, patternNeighborEdgeWeight] = patternVector[j]
      let maybeTargetNeighbor = mappedTargetVertex(patternNeighbor)
      if (
        maybeTargetNeighbor === null ||
        !isAdjacent(
          target,
          getIndex,
          (edge, neighborIndex) =>
            getIndex(edge) === neighborIndex && getWeight(edge) >= patternNeighborEdgeWeight,
          correspondingTargetVertex,
          maybeTargetNeighbor
        )
      ) {
        return []
      }
    }
    iso.push(correspondingTargetVertex)
  }
  return [iso]
}

// Given a Mapping, return a mapping in which patternVertex in mapped to targetVertex
const setMappingInPossibleMappings = (
  possibleMappings: Mapping,
  patternVertex: number,
  targetVertex: number
) => {
  let mapping = []
  for (let i = 0; i < possibleMappings.length; i++) {
    let possibleMappingsForPatternVertex = possibleMappings[i]
    mapping.push(
      i === patternVertex
      ? [targetVertex]
      : possibleMappingsForPatternVertex
    )
  }
  return mapping
}

const refine = (
  mapping: Mapping,
  predicate: (patternVertex: number, possibleTargetVertex: number) => boolean
): Mapping | null => {
  let refinedMapping: Mapping = []
  for (let patternVertex = 0; patternVertex < mapping.length; patternVertex++) {
    refinedMapping.push([])
    let mappingVector = mapping[patternVertex]

    if (mappingVector.length === 0) return null // No possible mapping!

    for (let i = 0; i < mappingVector.length; i++) {
      let possibleTarget = mappingVector[i]
      if (predicate(patternVertex, possibleTarget)) {
        refinedMapping[patternVertex].push(possibleTarget)
      }
    }
  }

  return refinedMapping
}

const degreeRefine = (
  pattern: WeightedDiGraph,
  target: WeightedDiGraph,
  mapping: Mapping
): Mapping | null => {
  // What is the degree of `vertex` in `graph`?
  const deg = (
    graph: WeightedDiGraph,
    vertex: number
  ) => graph[vertex].length

  return refine(
    mapping,
    (patternVertex: number, targetVertex: number) =>
    deg(pattern, patternVertex) <= deg(target, targetVertex)
  )
}

const ullmanRefine = (
  pattern: WeightedDiGraph,
  target: WeightedDiGraph,
  mapping: Mapping
): Mapping | null =>
refine(
  mapping,
  (patternVertex: number, targetVertex: number): boolean => all(
    ([patternVertexNeighbor, patternNeighborEdgeWeight]) => any(
      ([targetVertexNeighbor, targetNeighborEdgeWeight]) =>
        isAdjacent(
          mapping,
          (x) => x,
          (edge, neighborIndex) => edge === neighborIndex,
          patternVertexNeighbor,
          targetVertexNeighbor
        ) && patternNeighborEdgeWeight <= targetNeighborEdgeWeight,
      target[targetVertex]
    ),
    pattern[patternVertex]
  )
)

const search = (
  pattern: WeightedDiGraph,
  target: WeightedDiGraph,
  possibleMappings: Mapping,
  scanVertex: number
): Isomorphism[] =>
{
  const maybeRefined = ullmanRefine(
    pattern,
    target,
    possibleMappings
  )
  return !maybeRefined
  ? []
  : scanVertex < possibleMappings.length
    ? flatmap(
      (speculativeTargetMappingForScanVertex) => search(
        pattern,
        target,
        setMappingInPossibleMappings(
          maybeRefined,
          scanVertex,
          speculativeTargetMappingForScanVertex
        ),
        scanVertex + 1
      ),
      possibleMappings[scanVertex]
    )
    : extractAtMostOneIsomorphism(pattern, target, possibleMappings)
}

const allMappings = (
  patternOrder: number,
  targetOrder: number
): Mapping => {
  let mapping: Mapping = []
  for (let i = 0; i < patternOrder; i++) {
    mapping.push([])
    for (let j = 0; j < targetOrder; j++) {
      mapping[i].push(j)
    }
  }
  return mapping
}

export const allIsomorphismsForWeightedDigraphs = (
  pattern: WeightedDiGraph,
  target: WeightedDiGraph,
  initialpossibleMappings: ?Mapping
): Isomorphism[] => {

  const maybeRefined = degreeRefine(
    pattern,
    target,
    initialpossibleMappings || allMappings(pattern.length, target.length)
  )
  return !maybeRefined
    ? []
    : pattern.length > target.length
      ? []
      : search(
        pattern,
        target,
        maybeRefined,
        0
      )
}

export const allIsomorphismsForDigraphs = (
  pattern: DiGraph,
  target: DiGraph,
  initialpossibleMappings: ?Mapping
): Isomorphism[] => {
  const weightedPattern = digraphToWeighted(pattern)
  const weightedTarget = digraphToWeighted(target)

  return allIsomorphismsForWeightedDigraphs(
    weightedPattern,
    weightedTarget,
    initialpossibleMappings
  )
}
