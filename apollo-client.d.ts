// This import is necessary to ensure all Apollo Client imports
// are still available to the rest of the application.
import "@apollo/client";
import { CompleteHKT, StreamingHKT } from "./custom-types";
declare module "@apollo/client" {
  export interface TypeOverrides {
    Complete: CompleteHKT;
    Streaming: StreamingHKT;
  }
}
