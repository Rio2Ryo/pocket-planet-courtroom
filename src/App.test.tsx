import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('Pocket Planet Courtroom UI', () => {
  it('renders the first 10 second hook and changes transcript after interaction', async () => {
    render(<App />)
    expect(screen.getByText(/Pocket Planet Courtroom/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '判決スタンプ' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Squeeze cloud/ }))
    expect(screen.getByText(/cloud wig leaks/i)).toBeInTheDocument()
  })

  it('exposes debug API and composes sequential API commands', () => {
    render(<App />)
    expect(window.__PLANET_COURT__).toBeTruthy()
    let next: ReturnType<NonNullable<typeof window.__PLANET_COURT__>['rain']> | undefined
    act(() => {
      window.__PLANET_COURT__?.rain(6)
      next = window.__PLANET_COURT__?.rule('community-service')
    })
    expect(next?.transcript[0]).toContain('community service')
    expect(next?.transcript[1]).toContain('cloud wig leaks')
  })
})
