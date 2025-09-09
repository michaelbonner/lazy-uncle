import { gql } from "@apollo/client";

export const CREATE_BIRTHDAY_MUTATION = gql`
  mutation CreateBirthday(
    $name: String!
    $date: String!
    $category: String
    $parent: String
    $notes: String
    $userId: String!
    $importSource: String
  ) {
    createBirthday(
      name: $name
      date: $date
      category: $category
      parent: $parent
      notes: $notes
      userId: $userId
      importSource: $importSource
    ) {
      id
      name
      date
      category
      parent
      notes
      importSource
      __typename
    }
  }
`;

export const EDIT_BIRTHDAY_MUTATION = gql`
  mutation EditBirthday(
    $id: String!
    $name: String!
    $date: String!
    $category: String
    $parent: String
    $notes: String
    $importSource: String
  ) {
    editBirthday(
      id: $id
      name: $name
      date: $date
      category: $category
      parent: $parent
      notes: $notes
      importSource: $importSource
    ) {
      id
      name
      date
      category
      parent
      notes
      importSource
      __typename
    }
  }
`;

export const GET_ALL_BIRTHDAYS_QUERY = gql`
  query Birthdays {
    birthdays {
      id
      name
      date
      category
      parent
      notes
      importSource
      __typename
    }
  }
`;

export const GET_BIRTHDAY_BY_ID_QUERY = gql`
  query BirthdayById($birthdayId: String!) {
    birthday(birthdayId: $birthdayId) {
      id
      name
      date
      category
      parent
      notes
      importSource
      __typename
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
