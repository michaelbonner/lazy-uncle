import { FC, ReactElement, useEffect, useState } from "react";

const ClientOnly: FC<{ children: ReactElement }> = ({
  children,
  ...delegated
}) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <div {...delegated}>{children}</div>;
};
export default ClientOnly;
