import { createContext, FC, useState } from "react";

type ContextProps = {
  nameFilter?: string;
  // eslint-disable-next-line no-unused-vars
  setNameFilter?: (name: string) => void;
  categoryFilter?: string;
  // eslint-disable-next-line no-unused-vars
  setCategoryFilter?: (category: string) => void;
  parentFilter?: string;
  // eslint-disable-next-line no-unused-vars
  setParentFilter?: (parent: string) => void;
  zodiacSignFilter?: string;
  // eslint-disable-next-line no-unused-vars
  setZodiacSignFilter?: (zodiacSign: string) => void;
};

export const SearchContext = createContext<ContextProps>({});

export const SearchProvider: FC = ({ children }) => {
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [parentFilter, setParentFilter] = useState("");
  const [zodiacSignFilter, setZodiacSignFilter] = useState("");

  return (
    <SearchContext.Provider
      value={
        {
          nameFilter,
          setNameFilter,
          categoryFilter,
          setCategoryFilter,
          parentFilter,
          setParentFilter,
          zodiacSignFilter,
          setZodiacSignFilter,
        } as ContextProps
      }
    >
      {children}
    </SearchContext.Provider>
  );
};
