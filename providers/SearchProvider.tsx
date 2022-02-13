import { createContext, FC, useState } from "react";

type ContextProps = {
  nameFilter: string;
  // eslint-disable-next-line no-unused-vars
  setNameFilter: (name: string) => void;
  categoryFilter: string;
  // eslint-disable-next-line no-unused-vars
  setCategoryFilter: (category: string) => void;
  parentFilter: string;
  // eslint-disable-next-line no-unused-vars
  setParentFilter: (parent: string) => void;
  zodiacSignFilter: string;
  // eslint-disable-next-line no-unused-vars
  setZodiacSignFilter: (zodiacSign: string) => void;
  sortBy: string;
  // eslint-disable-next-line no-unused-vars
  setSortBy: (sort: string) => void;
  showFilters: boolean;
  // eslint-disable-next-line no-unused-vars
  setShowFilters: (shouldShow: boolean) => void;
};

const initialState = {
  nameFilter: "",
  setNameFilter: () => {},
  categoryFilter: "",
  setCategoryFilter: () => {},
  parentFilter: "",
  setParentFilter: () => {},
  zodiacSignFilter: "",
  setZodiacSignFilter: () => {},
  sortBy: "",
  setSortBy: () => {},
  showFilters: false,
  setShowFilters: () => {},
};

export const SearchContext = createContext<ContextProps>(initialState);

export const SearchProvider: FC = ({ children }) => {
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [parentFilter, setParentFilter] = useState("");
  const [zodiacSignFilter, setZodiacSignFilter] = useState("");
  const [sortBy, setSortBy] = useState("date_asc");
  const [showFilters, setShowFilters] = useState(false);

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
          sortBy,
          setSortBy,
          showFilters,
          setShowFilters,
        } as ContextProps
      }
    >
      {children}
    </SearchContext.Provider>
  );
};
