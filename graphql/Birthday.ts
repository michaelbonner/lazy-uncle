import { gql } from "@apollo/client";

export const CREATE_BIRTHDAY_MUTATION = gql`
  mutation CreateBirthday(
    $name: String!
    $year: Int
    $month: Int!
    $day: Int!
    $category: String
    $parent: String
    $notes: String
    $remindersEnabled: Boolean
    $userId: String!
    $importSource: String
  ) {
    createBirthday(
      name: $name
      year: $year
      month: $month
      day: $day
      category: $category
      parent: $parent
      notes: $notes
      remindersEnabled: $remindersEnabled
      userId: $userId
      importSource: $importSource
    ) {
      id
      name
      year
      month
      day
      date
      category
      parent
      notes
      remindersEnabled
      importSource
      __typename
    }
  }
`;

export const EDIT_BIRTHDAY_MUTATION = gql`
  mutation EditBirthday(
    $id: String!
    $name: String!
    $year: Int
    $month: Int!
    $day: Int!
    $category: String
    $parent: String
    $notes: String
    $remindersEnabled: Boolean
    $importSource: String
  ) {
    editBirthday(
      id: $id
      name: $name
      year: $year
      month: $month
      day: $day
      category: $category
      parent: $parent
      notes: $notes
      remindersEnabled: $remindersEnabled
      importSource: $importSource
    ) {
      id
      name
      year
      month
      day
      date
      category
      parent
      notes
      remindersEnabled
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
      year
      month
      day
      date
      category
      parent
      notes
      remindersEnabled
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
      year
      month
      day
      date
      category
      parent
      notes
      remindersEnabled
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
