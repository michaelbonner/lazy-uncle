import { gql } from "@apollo/client";

export const CREATE_SHARING_LINK_MUTATION = gql`
  mutation CreateSharingLink($description: String, $expirationHours: Int) {
    createSharingLink(
      description: $description
      expirationHours: $expirationHours
    ) {
      id
      token
      createdAt
      expiresAt
      isActive
      description
      submissionCount
      __typename
    }
  }
`;

export const REVOKE_SHARING_LINK_MUTATION = gql`
  mutation RevokeSharingLink($linkId: String!) {
    revokeSharingLink(linkId: $linkId) {
      id
      token
      isActive
      __typename
    }
  }
`;

export const SUBMIT_BIRTHDAY_MUTATION = gql`
  mutation SubmitBirthday(
    $token: String!
    $name: String!
    $year: Int
    $month: Int!
    $day: Int!
    $category: String
    $notes: String
    $submitterName: String
    $submitterEmail: String
    $relationship: String
  ) {
    submitBirthday(
      token: $token
      name: $name
      year: $year
      month: $month
      day: $day
      category: $category
      notes: $notes
      submitterName: $submitterName
      submitterEmail: $submitterEmail
      relationship: $relationship
    ) {
      id
      name
      year
      month
      day
      date
      category
      notes
      submitterName
      submitterEmail
      relationship
      status
      createdAt
      __typename
    }
  }
`;

export const GET_SHARING_LINKS_QUERY = gql`
  query SharingLinks {
    sharingLinks {
      id
      token
      createdAt
      expiresAt
      isActive
      description
      submissionCount
      __typename
    }
  }
`;

export const GET_PENDING_SUBMISSIONS_QUERY = gql`
  query PendingSubmissions {
    pendingSubmissions {
      submissions {
        id
        name
        year
        month
        day
        date
        category
        notes
        submitterName
        submitterEmail
        relationship
        status
        createdAt
        sharingLink {
          id
          description
          __typename
        }
        __typename
      }
    }
  }
`;

export const IMPORT_SUBMISSION_MUTATION = gql`
  mutation ImportSubmission($submissionId: String!) {
    importSubmission(submissionId: $submissionId) {
      id
      name
      year
      month
      day
      date
      category
      notes
      __typename
    }
  }
`;

export const REJECT_SUBMISSION_MUTATION = gql`
  mutation RejectSubmission($submissionId: String!) {
    rejectSubmission(submissionId: $submissionId) {
      id
      status
      __typename
    }
  }
`;

export const GET_NOTIFICATION_PREFERENCES_QUERY = gql`
  query NotificationPreferences {
    notificationPreferences {
      id
      userId
      emailNotifications
      summaryNotifications
      birthdayReminders
      __typename
    }
  }
`;

export const UPDATE_NOTIFICATION_PREFERENCES_MUTATION = gql`
  mutation UpdateNotificationPreferences(
    $emailNotifications: Boolean
    $summaryNotifications: Boolean
    $birthdayReminders: Boolean
  ) {
    updateNotificationPreferences(
      emailNotifications: $emailNotifications
      summaryNotifications: $summaryNotifications
      birthdayReminders: $birthdayReminders
    ) {
      id
      userId
      emailNotifications
      summaryNotifications
      birthdayReminders
      __typename
    }
  }
`;

export const VALIDATE_SHARING_LINK_QUERY = gql`
  query ValidateSharingLink($token: String!) {
    validateSharingLink(token: $token) {
      isValid
      error
      message
      sharingLink {
        id
        description
        expiresAt
        ownerName
        __typename
      }
      __typename
    }
  }
`;
