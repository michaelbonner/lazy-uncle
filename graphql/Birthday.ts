import { gql } from "@apollo/client";

export const CREATE_BIRTHDAY_MUTATION = gql`
  mutation CreateBirthday(
    $name: String!
    $date: String!
    $category: String
    $parent: String
    $notes: String
    $userId: String!
  ) {
    createBirthday(
      name: $name
      date: $date
      category: $category
      parent: $parent
      notes: $notes
      userId: $userId
    ) {
      name
      date
      category
      parent
      notes
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
  ) {
    editBirthday(
      id: $id
      name: $name
      date: $date
      category: $category
      parent: $parent
      notes: $notes
    ) {
      id
      name
      date
      category
      parent
      notes
    }
  }
`;

export const GET_ALL_BIRTHDAYS_QUERY = gql`
  query Birthdays($userId: String!) {
    birthdays(userId: $userId) {
      id
      name
      date
      category
      parent
      notes
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
