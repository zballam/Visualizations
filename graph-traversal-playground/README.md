# Graph Traversal Playground Export

This folder is the standalone GitHub export for the BFS/DFS visualization work.

## What is here

- `src/`
  - the portable TypeScript algorithm core from the website version
- `python/`
  - a simple Python CLI visualization that runs the traversal logic directly in Python

## Python CLI

The Python version is intentionally simple and focused on showing the algorithm logic clearly.
It:

- builds a configurable tree
- runs BFS and DFS directly in Python
- optionally animates the traversal in the terminal
- reports the same core comparison metrics:
  - visited nodes
  - steps
  - max frontier size
  - traversal order

### Files

- `python/traversal.py`
  - tree generation, traversal logic, metrics, and terminal tree rendering
- `python/cli.py`
  - command line entry point

### Run it

From this folder:

```bash
python python/cli.py
```

Compare BFS and DFS on a larger tree:

```bash
python python/cli.py --depth 4 --branching 3 --mode compare
```

Animate the traversal:

```bash
python python/cli.py --depth 4 --branching 2 --mode compare --animate --delay 0.7
```

Run just DFS:

```bash
python python/cli.py --depth 5 --branching 2 --mode dfs --animate
```
