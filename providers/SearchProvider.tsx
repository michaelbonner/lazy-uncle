import {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useState,
} from "react";

type ContextProps = {
  isFiltered: boolean;
  nameFilter: string;
  setNameFilter: Dispatch<SetStateAction<string>>;
  categoryFilter: string;
  setCategoryFilter: Dispatch<SetStateAction<string>>;
  parentFilter: string;
  setParentFilter: Dispatch<SetStateAction<string>>;
  zodiacSignFilter: string;
  setZodiacSignFilter: Dispatch<SetStateAction<string>>;
  sortBy: string;
  setSortBy: Dispatch<SetStateAction<string>>;
  showFilters: boolean;
  setShowFilters: Dispatch<SetStateAction<boolean>>;
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

type SearchProviderProps = {
  children: ReactNode;
};

export const SearchProvider: FC<SearchProviderProps> = ({ children }) => {
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [parentFilter, setParentFilter] = useState("");
  const [zodiacSignFilter, setZodiacSignFilter] = useState("");
  const [sortBy, setSortBy] = useState("date_asc");
  const [showFilters, setShowFilters] = useState(false);

  const isFiltered = !!(nameFilter || categoryFilter || parentFilter || zodiacSignFilter);

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
