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

// In the directed graph `graph`, does `vertex` have an edge to `neighbor`?
const isAdjacent = (
  graph: DiGraph,
  vertex: number,
  neighbor: number
): boolean =>
{
  for (let i = 0; i <= graph[vertex].length; i++) {
    if (graph[vertex][i] > neighbor) return false // NOTE: adjacency list must be sorted ascending
    if (graph[vertex][i] === neighbor) return true
  }
  return false
}

const getIndex = ([index, weight]: WeightedEdge): number => index
const weightOneEdge = (index: number): WeightedEdge => [index, 1]
const digraphToWeighted = (graph: DiGraph): WeightedDiGraph => map(
  (neighbors) => map(
    (neighborIndex) => weightOneEdge(neighborIndex),
    neighbors
  ),
  graph
)

// What is the degree of `vertex` in `graph`?
const deg = (
  graph: DiGraph,
  vertex: number
) => graph[vertex].length

/* Ullman */

export const extractAtMostOneIsomorphism = (
  pattern: DiGraph,
  target: DiGraph,
  mapping: Mapping
): Isomorphism[] => {
  const mappedTargetVertex = (patternVertex: number): number | null =>
  mapping[patternVertex].length === 1
  ? mapping[patternVertex][0]
  : null

  let iso: Isomorphism = []

  for (let patternVertex = 0; patternVertex < pattern.length; patternVertex++) {
    let targetVertexForPatternVertex = mappedTargetVertex(patternVertex)
    if (targetVertexForPatternVertex === null) return []
    let patternVector = pattern[patternVertex]
    for (let j = 0; j < patternVector.length; j++) {
      let patternNeighbor = patternVector[j]
      let maybeTarget = mappedTargetVertex(patternNeighbor)
      if (
        maybeTarget === null ||
        !isAdjacent(
          target,
          targetVertexForPatternVertex,
          maybeTarget
        )
      ) {
        return []
      }
    }
    iso.push(targetVertexForPatternVertex)
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
  pattern: DiGraph,
  target: DiGraph,
  mapping: Mapping
): Mapping | null =>
refine(
  mapping,
  (patternVertex: number, targetVertex: number) =>
  deg(pattern, patternVertex) <= deg(target, targetVertex)
)

const ullmanRefine = (
  pattern: DiGraph,
  target: DiGraph,
  mapping: Mapping
): Mapping | null =>
refine(
  mapping,
  (patternVertex: number, targetVertex: number): boolean => all(
    (patternVertexNeighbor) => any(
      (targetVertexNeighbor) => isAdjacent(mapping, patternVertexNeighbor, targetVertexNeighbor),
      target[targetVertex]
    ),
    pattern[patternVertex]
  )
)

const search = (
  pattern: DiGraph,
  target: DiGraph,
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

export const allIsomorphismsForDigraphs = (
  pattern: DiGraph,
  target: DiGraph,
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
