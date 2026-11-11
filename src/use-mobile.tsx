import * as React from "react"

// Мобильді құрылғылар үшін стандартты шек - 768px
const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Медиа сұранысты орнату
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Жағдайды тексеру функциясы
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Оқиғаны тыңдау (заманауи браузерлер үшін)
    try {
      mql.addEventListener("change", onChange)
    } catch (e) {
      // Ескі браузерлер үшін (Safari-дің ескі нұсқалары)
      mql.addListener(onChange)
    }

    // Алғашқы тексеріс
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    // Тазалау (Cleanup)
    return () => {
      try {
        mql.removeEventListener("change", onChange)
      } catch (e) {
        mql.removeListener(onChange)
      }
    }
  }, [])

  return isMobile
}
