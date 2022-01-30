import { gql } from "@apollo/client";

export const CREATE_BIRTHDAY_MUTATION = gql`
  mutation CreateBirthday($name: String!, $date: String!, $userId: String!) {
    createBirthday(name: $name, date: $date, userId: $userId) {
      name
      date
    }
  }
`;

export const GET_ALL_BIRTHDAYS_QUERY = gql`
  query Birthdays {
    birthdays {
      id
      name
      date
    }
  }
`;
