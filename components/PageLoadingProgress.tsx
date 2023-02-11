import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";

export const PageLoadingProgress = () => {
  const router = useRouter();

  const [widthPercentage, setWidthPercentage] = useState(0);

  const loaderIsVisible = useMemo(() => {
    return widthPercentage > 0 && widthPercentage < 100;
  }, [widthPercentage]);
  let timeout = useRef<NodeJS.Timeout | null>(null);
  let interval = useRef<NodeJS.Timeout | null>(null);

  useEffect(
    () => console.log("widthPercentage", widthPercentage),
    [widthPercentage]
  );

  useEffect(() => {
    const handleStart = () => {
      setWidthPercentage(15);

      // clear any previous interval so we can start over
      if (interval.current) {
        clearInterval(interval.current);
        interval.current = null;
        return;
      }

      // Set an interval to increase the loader bar
      interval.current = setInterval(() => {
        setWidthPercentage((widthPercentage) => {
          if (widthPercentage >= 95) {
            return 95;
          }

          return widthPercentage + Math.floor(Math.random() * 10);
        });
      }, 500);
    };

    const handleStop = () => {
      setWidthPercentage(100);

      // Clear any previous timeout
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }

      // Clear any previous interval
      if (interval.current) {
        clearInterval(interval.current);
        interval.current = null;
      }

      // Set a timeout to hide the loader after the animation finishes
      timeout.current = setTimeout(() => {
        setWidthPercentage(0);
      }, 500);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

  return (
    <div className="absolute z-30 top-0 left-0 right-0 h-1">
      <div
        className="h-1 shadow-sm bg-cyan-50 transition-all duration-500"
        style={{
          width: `${widthPercentage}%`,
          opacity: loaderIsVisible ? 1 : 0,
        }}
      />
    </div>
  );
};
