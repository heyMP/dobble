---
name: react-signals
description: Implement state management using Preact Signals in React for fine-grained reactivity. Use when adding signals, managing state, or optimizing performance in React components.
---

# React Signals (Preact)

## Instructions

This skill guides the implementation of `@preact/signals-react` for state management in React applications. Signals offer fine-grained reactivity and performance optimization by bypassing unnecessary re-renders.

### 1. Installation

Install the React adapter:
```bash
npm install @preact/signals-react
```

### 2. Core Concepts

*   **Signal**: A reactive container for a value (`signal(initialValue)`). Access value via `.value`.
*   **Computed**: A value derived from other signals (`computed(() => signal.value * 2)`). Updates automatically.
*   **Effect**: Runs a side effect when signals accessed inside it change (`effect(() => console.log(signal.value))`).
*   **Batch**: Group multiple signal updates into a single render (`batch(() => { ... })`).

### 3. Usage Patterns

#### Local State (Inside Components)
*   **Create**: Use `useSignal(initialValue)` for component-local state (or `useRef(signal(val)).current` if avoiding hooks).
*   **Read**: Access `signal.value` directly in JSX.
*   **Update**: Mutate `signal.value = newValue`.

#### Global State (Outside Components)
*   **Define**: Export signals from a standalone file (e.g., `store.ts`).
*   **Consume**: Import and use directly in any component. No context provider needed for simple global state.

#### Context Integration
*   Pass signals through React Context for dependency injection or scoped state.
*   Consume with `useContext` and access `.value`.

### 4. Best Practices

*   **Direct Access**: Access `.value` inside JSX to allow text-node updates without re-rendering the full component.
*   **Immutability**: While signals are mutable containers, update complex objects/arrays immutably for predictability (`list.value = [...list.value, item]`).
*   **Computed**: Use `computed` for expensive derivations to cache results.
*   **Batching**: Use `batch()` when updating multiple signals synchronously to trigger a single update.

## Examples

For detailed code examples, see [examples.md](examples.md).
