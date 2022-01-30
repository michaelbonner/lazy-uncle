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
  query Birthdays($userId: String!) {
    birthdays(userId: $userId) {
      id
      name
      date
    }
  }
`;

export const DELETE_BIRTHDAY_MUTATION = gql`
  mutation DeleteBirthday($birthdayId: String!) {
    deleteBirthday(birthdayId: $birthdayId) {
      id
    }
  }
`;
