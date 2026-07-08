# Frontend Test Skill

Run and manage tests for the React/TypeScript frontend located at `taskflow-UI/`.

## Setup (first time only)

The project has no test framework yet. Install Vitest and Testing Library:

```bash
cd taskflow-UI
pnpm add -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Add a `test` script to `package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui"
}
```

Create `vitest.config.ts` at `taskflow-UI/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

Create `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

## How to run tests

```bash
cd taskflow-UI
pnpm test              # run once
pnpm test:watch        # watch mode
pnpm test:ui           # browser UI
```

Run a single file:
```bash
pnpm vitest run src/path/to/file.test.tsx
```

## Test patterns to follow

**Utility/helper functions** — plain unit tests, no React needed:
```ts
// src/app/utils.test.ts
import { describe, it, expect } from 'vitest'
import { getPasswordStrength } from './utils'

describe('getPasswordStrength', () => {
  it('returns score 4 for a strong password', () => {
    expect(getPasswordStrength('Abc123!@#').score).toBe(4)
  })
})
```

**React components** — render and assert on DOM:
```tsx
// src/app/components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

it('calls onClick when clicked', async () => {
  const handler = vi.fn()
  render(<button onClick={handler}>Click me</button>)
  await userEvent.click(screen.getByRole('button'))
  expect(handler).toHaveBeenCalledOnce()
})
```

**API modules** — mock axios and assert request shape:
```ts
// src/api/tasks.test.ts
import { vi } from 'vitest'
import axios from './axios'
import { tasksApi } from './tasks'

vi.mock('./axios')
const mockedAxios = vi.mocked(axios)

it('calls POST /boards/:id/tasks on create', async () => {
  mockedAxios.post = vi.fn().mockResolvedValue({ data: { id: 1 } })
  await tasksApi.create(1, { title: 'Test', type: 'FEATURE', columnId: 2 })
  expect(mockedAxios.post).toHaveBeenCalledWith('/boards/1/tasks', expect.objectContaining({ title: 'Test' }))
})
```

## What to do when invoked

1. Check if Vitest is installed (`pnpm list vitest`); run the setup steps above if not.
2. Check if `vitest.config.ts` and `src/test/setup.ts` exist; create them if not.
3. Run `pnpm test` and report results.
4. If no test files exist yet, write tests for whichever module the user is working on — prefer utility functions and API modules first as they are pure and easy to test, then components.
5. Co-locate test files next to source files: `foo.ts` → `foo.test.ts`.
