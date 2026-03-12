from __future__ import annotations

import argparse
import time

from traversal import build_tree, render_tree, run_traversal


def format_node_labels(node_ids: tuple[str, ...], label_lookup: dict[str, str]) -> str:
    return " -> ".join(label_lookup[node_id] for node_id in node_ids) if node_ids else "empty"


def print_summary(title: str, result, label_lookup: dict[str, str]) -> None:
    print(f"\n{title}")
    print("-" * len(title))
    print(f"Visited nodes : {result.visited_count}")
    print(f"Steps         : {result.steps}")
    print(f"Max frontier  : {result.max_frontier_size}")
    print(f"Order         : {format_node_labels(result.order, label_lookup)}")


def animate_result(title: str, levels, nodes, result, label_lookup: dict[str, str], delay: float) -> None:
    for step, frame in enumerate(result.frames, start=1):
        print("\033[2J\033[H", end="")
        print(title)
        print("=" * len(title))
        print(render_tree(levels, nodes, frame))
        print()
        print(f"Current       : {label_lookup[frame.current_id]}")
        print(f"Frontier      : {format_node_labels(frame.frontier, label_lookup)}")
        print(f"Visited count : {frame.visited_count}")
        print(f"Steps         : {step}")
        print(f"Max frontier  : {frame.max_frontier_size}")
        print(f"Order         : {format_node_labels(frame.order, label_lookup)}")
        time.sleep(delay)


def compare_results(bfs_result, dfs_result) -> str:
    if bfs_result.visited_count == dfs_result.visited_count:
        winner = "Tie"
    elif bfs_result.visited_count < dfs_result.visited_count:
        winner = "BFS"
    else:
        winner = "DFS"

    return "\n".join(
        [
            "\nComparison",
            "----------",
            f"Winner by visited nodes : {winner}",
            f"BFS visited / steps     : {bfs_result.visited_count} / {bfs_result.steps}",
            f"DFS visited / steps     : {dfs_result.visited_count} / {dfs_result.steps}",
            f"BFS max frontier        : {bfs_result.max_frontier_size}",
            f"DFS max frontier        : {dfs_result.max_frontier_size}",
        ]
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Terminal BFS vs DFS tree traversal demo")
    parser.add_argument("--depth", type=int, default=3, help="Tree depth (minimum 1)")
    parser.add_argument("--branching", type=int, default=2, help="Children per node (minimum 1)")
    parser.add_argument(
        "--mode",
        choices=("compare", "bfs", "dfs"),
        default="compare",
        help="Run a comparison or a single algorithm",
    )
    parser.add_argument("--animate", action="store_true", help="Animate the traversal in the terminal")
    parser.add_argument("--delay", type=float, default=0.6, help="Seconds between animation frames")
    args = parser.parse_args()

    nodes, levels, root_id = build_tree(args.depth, args.branching)
    label_lookup = {node_id: node.label for node_id, node in nodes.items()}

    bfs_result = run_traversal(nodes, root_id, "bfs")
    dfs_result = run_traversal(nodes, root_id, "dfs")

    if args.mode in {"compare", "bfs"} and args.animate:
        animate_result("Breadth-First Search", levels, nodes, bfs_result, label_lookup, args.delay)
    if args.mode in {"compare", "dfs"} and args.animate:
        animate_result("Depth-First Search", levels, nodes, dfs_result, label_lookup, args.delay)

    print("\033[2J\033[H", end="")
    print(f"Tree depth: {max(1, args.depth)} | Branching factor: {max(1, args.branching)}")

    if args.mode in {"compare", "bfs"}:
        print_summary("Breadth-First Search", bfs_result, label_lookup)
    if args.mode in {"compare", "dfs"}:
        print_summary("Depth-First Search", dfs_result, label_lookup)
    if args.mode == "compare":
        print(compare_results(bfs_result, dfs_result))


if __name__ == "__main__":
    main()
