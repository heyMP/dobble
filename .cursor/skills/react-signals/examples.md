# React Signals Examples

## 1. Basic Counter (Local State)

```tsx
import { useSignal } from "@preact/signals-react";

export function Counter() {
  const count = useSignal(0);

  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
}
```

## 2. Computed Values

```tsx
import { useSignal, useComputed } from "@preact/signals-react";

export function Multiplier() {
  const count = useSignal(1);
  const double = useComputed(() => count.value * 2);

  return (
    <div>
      <p>Value: {count.value}</p>
      <p>Doubled: {double.value}</p>
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
}
```

## 3. Global State Store

**store.ts**
```ts
import { signal, computed } from "@preact/signals-react";

export const count = signal(0);
export const double = computed(() => count.value * 2);

export function increment() {
  count.value++;
}
```

**Component.tsx**
```tsx
import { count, double, increment } from "./store";

export function GlobalCounter() {
  return (
    <div>
      <p>Global Count: {count.value}</p>
      <p>Global Double: {double.value}</p>
      <button onClick={increment}>Increment Global</button>
    </div>
  );
}
```

## 4. Optimization with Batching

```ts
import { signal, batch } from "@preact/signals-react";

const name = signal("John");
const age = signal(30);

// Updates trigger only one notification/render
function updateProfile() {
  batch(() => {
    name.value = "Jane";
    age.value = 31;
  });
}
```

## 5. Async Data Fetching

```tsx
import { signal } from "@preact/signals-react";

const data = signal(null);
const loading = signal(false);
const error = signal(null);

async function fetchData(id) {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch(`/api/data/${id}`);
    data.value = await res.json();
  } catch (err) {
    error.value = err;
  } finally {
    loading.value = false;
  }
}
```
