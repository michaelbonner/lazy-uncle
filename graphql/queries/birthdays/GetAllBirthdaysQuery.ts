import { gql } from "@apollo/client";

export default gql`
  query Birthdays {
    birthdays {
      id
      name
      date
    }
  }
`;
