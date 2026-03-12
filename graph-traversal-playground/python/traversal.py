from __future__ import annotations

from collections import deque
from dataclasses import dataclass


@dataclass(frozen=True)
class TreeNode:
    id: str
    label: str
    level: int
    children: tuple[str, ...]


@dataclass(frozen=True)
class TraversalFrame:
    current_id: str
    frontier: tuple[str, ...]
    visited: tuple[str, ...]
    order: tuple[str, ...]
    visited_count: int
    frontier_size: int
    max_frontier_size: int


@dataclass(frozen=True)
class TraversalResult:
    algorithm: str
    frames: tuple[TraversalFrame, ...]
    order: tuple[str, ...]
    visited_count: int
    steps: int
    max_frontier_size: int


def build_tree(depth: int, branching: int) -> tuple[dict[str, TreeNode], tuple[tuple[str, ...], ...], str]:
    safe_depth = max(1, depth)
    safe_branching = max(1, branching)

    next_label = 1
    root_id = f"node-{next_label}"
    current_level = [root_id]
    levels: list[tuple[str, ...]] = [tuple(current_level)]
    node_meta: dict[str, dict[str, object]] = {
        root_id: {"label": str(next_label), "level": 0, "children": []},
    }
    next_label += 1

    for level in range(1, safe_depth):
        next_level: list[str] = []
        for parent_id in current_level:
            children: list[str] = []
            for _ in range(safe_branching):
                child_id = f"node-{next_label}"
                children.append(child_id)
                next_level.append(child_id)
                node_meta[child_id] = {"label": str(next_label), "level": level, "children": []}
                next_label += 1
            node_meta[parent_id]["children"] = children
        current_level = next_level
        levels.append(tuple(current_level))

    nodes = {
        node_id: TreeNode(
            id=node_id,
            label=str(meta["label"]),
            level=int(meta["level"]),
            children=tuple(meta["children"]),
        )
        for node_id, meta in node_meta.items()
    }
    return nodes, tuple(levels), root_id


def run_traversal(nodes: dict[str, TreeNode], root_id: str, algorithm: str) -> TraversalResult:
    if algorithm not in {"bfs", "dfs"}:
        raise ValueError("algorithm must be 'bfs' or 'dfs'")

    frontier: deque[str] | list[str]
    if algorithm == "bfs":
        frontier = deque([root_id])
    else:
        frontier = [root_id]

    discovered = {root_id}
    visited: set[str] = set()
    order: list[str] = []
    frames: list[TraversalFrame] = []
    max_frontier_size = 1

    while frontier:
        current_id = frontier.popleft() if algorithm == "bfs" else frontier.pop()
        if current_id in visited:
            continue

        visited.add(current_id)
        order.append(current_id)
        children = list(nodes[current_id].children)
        additions = list(reversed(children)) if algorithm == "dfs" else children

        for child_id in additions:
            if child_id in discovered:
                continue
            discovered.add(child_id)
            frontier.append(child_id)

        max_frontier_size = max(max_frontier_size, len(frontier))
        frames.append(
            TraversalFrame(
                current_id=current_id,
                frontier=tuple(frontier),
                visited=tuple(visited),
                order=tuple(order),
                visited_count=len(visited),
                frontier_size=len(frontier),
                max_frontier_size=max_frontier_size,
            )
        )

    return TraversalResult(
        algorithm=algorithm,
        frames=tuple(frames),
        order=tuple(order),
        visited_count=len(visited),
        steps=len(frames),
        max_frontier_size=max_frontier_size,
    )


def render_tree(levels: tuple[tuple[str, ...], ...], nodes: dict[str, TreeNode], frame: TraversalFrame) -> str:
    visited = set(frame.visited)
    frontier = set(frame.frontier)
    rows: list[str] = []
    total_levels = len(levels)

    for level_index, level_nodes in enumerate(levels):
        indent = " " * max(0, (total_levels - level_index - 1) * 3)
        between = " " * max(2, (total_levels - level_index - 1) * 2)
        pieces: list[str] = []

        for node_id in level_nodes:
            label = nodes[node_id].label.rjust(2)
            if node_id == frame.current_id:
                pieces.append(f">{label}<")
            elif node_id in visited:
                pieces.append(f"[{label}]")
            elif node_id in frontier:
                pieces.append(f"({label})")
            else:
                pieces.append(f" {label} ")

        rows.append(f"{indent}{between.join(pieces)}")

    return "\n".join(rows)
