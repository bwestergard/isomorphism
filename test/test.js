/* @flow */
/* global describe, it */

import { clone } from 'ramda'
import assert from 'assert'
import { allIsomorphismsForDigraphs, allIsomorphismsForWeightedDigraphs } from '../lib/index'

declare class describe {
  static (description: string, spec: () => void): void;
}

declare class it {
  static (description: string, spec: () => void): void;
}

// TODO test for every error type

describe('Weighted', function () {

  it('Three-cycle with one two-weighted edge has one isomorpism to a certain directed Hajos graph', function () {
    assert.deepEqual(
      allIsomorphismsForWeightedDigraphs(
        [
          [[1,200]],
          [[2,1]],
          [[0,1]]
        ],
        [
          [[1,800]],
          [[2,1],[3,1]],
          [[0,1],[4,1]],
          [[4,1]],
          [[1,1],[5,1]],
          [[2,1]]
        ],
        null
      ),
      [
        [0,1,2]
      ]
    )
  })

})

describe('Unweighted', function () {

  it('a -> b has only one isomorphism to a -> b', function () {
    assert.deepEqual(
      allIsomorphismsForDigraphs(
        [
          [1],
          []
        ],
        [
          [1],
          []
        ],
        null
      ),
      [
        [0,1]
      ]
    )
  })

  it('Three-cycle isomorphic to every cycle', function () {
    assert.deepEqual(
      allIsomorphismsForDigraphs(
        [
          [1],
          [2],
          [0]
        ],
        [
          [1],
          [2],
          [0]
        ],
        null
      ),
      [
        [0,1,2],
        [1,2,0],
        [2,0,1]
      ]
    )
  })

  it('Isomorphisms for three-chain pattern on ten-chain', function () {
    assert.deepEqual(
      allIsomorphismsForDigraphs(
        [
          [1],
          [2],
          []
        ],
        [
          [1],
          [2],
          [3],
          [4],
          [5],
          [6],
          [7],
          [8],
          [9],
          []
        ],
        null
      ),
      [
        [0,1,2],
        [1,2,3],
        [2,3,4],
        [3,4,5],
        [4,5,6],
        [5,6,7],
        [6,7,8],
        [7,8,9]
      ]
    )
  })

  it('Isomorphisms for three-chain pattern on ten-cycle', function () {
    assert.deepEqual(
      allIsomorphismsForDigraphs(
        [
          [1],
          [2],
          []
        ],
        [
          [1],
          [2],
          [3],
          [4],
          [5],
          [6],
          [7],
          [8],
          [9],
          [0]
        ],
        null
      ),
      [
        [0,1,2],
        [1,2,3],
        [2,3,4],
        [3,4,5],
        [4,5,6],
        [5,6,7],
        [6,7,8],
        [7,8,9],
        [8,9,0],
        [9,0,1]
      ]
    )
  })

	// TODO firecracker graph and Y?

  it('Pattern larger than graph produces no isomorphisms', function () {
    assert.deepEqual(
      allIsomorphismsForDigraphs(
        [
          [1],
          [2],
          [3],
          [4],
          [5],
          [6],
          [7],
          [8],
          [9],
          [0]
        ],
        [
          [1],
          [2],
          []
        ],
        null
      ),
      []
    )
  })

	// http://mathworld.wolfram.com/HajosGraph.html
  it('Three-cycle has twelve isomorpisms to a certain directed Hajos graph', function () {
    assert.deepEqual(
      allIsomorphismsForDigraphs(
        [
          [1],
          [2],
          [0]
        ],
        [
          [1],
          [2,3],
          [0,4],
          [4],
          [1,5],
          [2]
        ],
        null
      ),
      [
        [0,1,2],
        [1,2,0],
        [1,2,4],
        [1,3,4],
        [2,0,1],
        [2,4,1],
        [2,4,5],
        [3,4,1],
        [4,1,2],
        [4,1,3],
        [4,5,2],
        [5,2,4]
      ]
    )
  })

  it('Isomorphisms for three-chain pattern on ten-cycle with orphans', function () {
    assert.deepEqual(
      allIsomorphismsForDigraphs(
        [
          [1],
          [2],
          []
        ],
        [
          [],
          [2],
          [3],
          [4],
          [5],
          [6],
          [7],
          [8],
          [9],
          [11],
          [],
          [1],
          [],
          [],
          [],
          [],
          []
        ],
        null
      ),
      [
        [1,2,3],
        [2,3,4],
        [3,4,5],
        [4,5,6],
        [5,6,7],
        [6,7,8],
        [7,8,9],
        [8,9,11],
        [9,11,1],
        [11,1,2]
      ]
    )
  })

  it('Self-reference in target graph does not match three-cycle', function () {
    assert.deepEqual(
      allIsomorphismsForWeightedDigraphs(
        [
          [[1,1]],
          [[2,1]],
          [[0,1]]
        ],
        [
          [],
          [[1,1]],
          []
        ],
        null
      ),
      []
    )
  })

  it('Self-reference in target graph does not match three-chain', function () {
    assert.deepEqual(
      allIsomorphismsForWeightedDigraphs(
        [
          [[1,1]],
          [[2,1]],
          []
        ],
        [
          [],
          [[1,1]],
          []
        ],
        null
      ),
      []
    )
  })

})
