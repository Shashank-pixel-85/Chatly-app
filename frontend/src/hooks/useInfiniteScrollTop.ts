import { RefObject, useEffect, useRef } from "react";

/**
 * Calls onReachTop when the user scrolls near the top of the container.
 * Preserves scroll position after new (older) content is prepended by
 * comparing scrollHeight before and after the load.
 */
export function useInfiniteScrollTop(
  containerRef: RefObject<HTMLElement>,
  onReachTop: () => Promise<void> | void,
  deps: { enabled: boolean; loading: boolean }
) {
  const prevHeight = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !deps.enabled) return;

    const handleScroll = () => {
      if (deps.loading) return;
      if (el.scrollTop < 120) {
        prevHeight.current = el.scrollHeight;
        void onReachTop();
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, deps.enabled, deps.loading]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !prevHeight.current || deps.loading) return;
    const diff = el.scrollHeight - prevHeight.current;
    if (diff > 0) {
      el.scrollTop += diff;
      prevHeight.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps.loading]);
}
