import { FC, ReactElement, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

const ClientOnly: FC<{ children: ReactElement }> = ({
  children,
  ...delegated
}) => {
  const hasMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!hasMounted) {
    return null;
  }

  return <div {...delegated}>{children}</div>;
};
export default ClientOnly;
