import { useEffect, useState } from 'react'

function useNow(intervalMs = 1000, enabled = true) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    const timer = window.setInterval(() => setNow(Date.now()), intervalMs)

    return () => window.clearInterval(timer)
  }, [intervalMs, enabled])

  return now
}

export default useNow
