import { createContext, FC, useEffect, useState } from "react";

type ContextProps = {
  isFiltered: boolean;
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
  clearFilters: () => void;
};

const initialState = {
  isFiltered: false,
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
  clearFilters: () => {},
};

export const SearchContext = createContext<ContextProps>(initialState);

export const SearchProvider: FC = ({ children }) => {
  const [isFiltered, setIsFiltered] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [parentFilter, setParentFilter] = useState("");
  const [zodiacSignFilter, setZodiacSignFilter] = useState("");
  const [sortBy, setSortBy] = useState("date_asc");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (nameFilter || categoryFilter || parentFilter || zodiacSignFilter) {
      setIsFiltered(true);
    } else {
      setIsFiltered(false);
    }
  }, [nameFilter, categoryFilter, parentFilter, zodiacSignFilter]);

  const clearFilters = () => {
    setNameFilter("");
    setCategoryFilter("");
    setParentFilter("");
    setZodiacSignFilter("");
  };

  return (
    <SearchContext.Provider
      value={
        {
          isFiltered,
          clearFilters,
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
