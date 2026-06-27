/**
 * ****************************************************
 * THIS FILE IS AUTO-GENERATED AT DEVELOPMENT TIME.
 *
 * DO NOT EDIT DIRECTLY OR COMMIT IT TO SOURCE CONTROL.
 * ****************************************************
 */
import { Query } from "attio/client";

type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };

type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

declare module "./get-candidate-context.graphql" {
  export type GetCandidateContextQueryVariables = Exact<{
    recordId: Scalars["String"]["input"];
  }>;

  export type GetCandidateContextQuery = {
    person: {
      name: { full_name: string | null } | null;
      cv_text:
        | { __typename: "RecordReferenceValue" }
        | { __typename: "MultiRecordReferenceValue" }
        | { __typename: "PersonalNameValue" }
        | { __typename: "TextValue"; value: string | null }
        | { __typename: "DateValue" }
        | { __typename: "TimestampValue" }
        | { __typename: "NumberValue" }
        | { __typename: "MultiEmailAddressValue" }
        | { __typename: "DomainValue" }
        | { __typename: "MultiDomainValue" }
        | { __typename: "LocationValue" }
        | { __typename: "InteractionValue" }
        | { __typename: "SelectValue" }
        | { __typename: "MultiSelectValue" }
        | { __typename: "StatusValue" }
        | { __typename: "CheckboxValue" }
        | { __typename: "RatingValue" }
        | { __typename: "PhoneNumberValue" }
        | { __typename: "MultiPhoneNumberValue" }
        | { __typename: "CurrencyValue" }
        | { __typename: "ActorReferenceValue" }
        | { __typename: "MultiActorReferenceValue" }
        | null;
      linkedin_url:
        | { __typename: "RecordReferenceValue" }
        | { __typename: "MultiRecordReferenceValue" }
        | { __typename: "PersonalNameValue" }
        | { __typename: "TextValue"; value: string | null }
        | { __typename: "DateValue" }
        | { __typename: "TimestampValue" }
        | { __typename: "NumberValue" }
        | { __typename: "MultiEmailAddressValue" }
        | { __typename: "DomainValue" }
        | { __typename: "MultiDomainValue" }
        | { __typename: "LocationValue" }
        | { __typename: "InteractionValue" }
        | { __typename: "SelectValue" }
        | { __typename: "MultiSelectValue" }
        | { __typename: "StatusValue" }
        | { __typename: "CheckboxValue" }
        | { __typename: "RatingValue" }
        | { __typename: "PhoneNumberValue" }
        | { __typename: "MultiPhoneNumberValue" }
        | { __typename: "CurrencyValue" }
        | { __typename: "ActorReferenceValue" }
        | { __typename: "MultiActorReferenceValue" }
        | null;
      role:
        | {
            __typename: "RecordReferenceValue";
            value:
              | {
                  id: string;
                  description:
                    | { __typename: "RecordReferenceValue" }
                    | { __typename: "MultiRecordReferenceValue" }
                    | { __typename: "PersonalNameValue" }
                    | { __typename: "TextValue"; value: string | null }
                    | { __typename: "DateValue" }
                    | { __typename: "TimestampValue" }
                    | { __typename: "NumberValue" }
                    | { __typename: "MultiEmailAddressValue" }
                    | { __typename: "DomainValue" }
                    | { __typename: "MultiDomainValue" }
                    | { __typename: "LocationValue" }
                    | { __typename: "InteractionValue" }
                    | { __typename: "SelectValue" }
                    | { __typename: "MultiSelectValue" }
                    | { __typename: "StatusValue" }
                    | { __typename: "CheckboxValue" }
                    | { __typename: "RatingValue" }
                    | { __typename: "PhoneNumberValue" }
                    | { __typename: "MultiPhoneNumberValue" }
                    | { __typename: "CurrencyValue" }
                    | { __typename: "ActorReferenceValue" }
                    | { __typename: "MultiActorReferenceValue" }
                    | null;
                  title:
                    | { __typename: "RecordReferenceValue" }
                    | { __typename: "MultiRecordReferenceValue" }
                    | { __typename: "PersonalNameValue" }
                    | { __typename: "TextValue"; value: string | null }
                    | { __typename: "DateValue" }
                    | { __typename: "TimestampValue" }
                    | { __typename: "NumberValue" }
                    | { __typename: "MultiEmailAddressValue" }
                    | { __typename: "DomainValue" }
                    | { __typename: "MultiDomainValue" }
                    | { __typename: "LocationValue" }
                    | { __typename: "InteractionValue" }
                    | { __typename: "SelectValue" }
                    | { __typename: "MultiSelectValue" }
                    | { __typename: "StatusValue" }
                    | { __typename: "CheckboxValue" }
                    | { __typename: "RatingValue" }
                    | { __typename: "PhoneNumberValue" }
                    | { __typename: "MultiPhoneNumberValue" }
                    | { __typename: "CurrencyValue" }
                    | { __typename: "ActorReferenceValue" }
                    | { __typename: "MultiActorReferenceValue" }
                    | null;
                }
              | {
                  id: string;
                  description:
                    | { __typename: "RecordReferenceValue" }
                    | { __typename: "MultiRecordReferenceValue" }
                    | { __typename: "PersonalNameValue" }
                    | { __typename: "TextValue"; value: string | null }
                    | { __typename: "DateValue" }
                    | { __typename: "TimestampValue" }
                    | { __typename: "NumberValue" }
                    | { __typename: "MultiEmailAddressValue" }
                    | { __typename: "DomainValue" }
                    | { __typename: "MultiDomainValue" }
                    | { __typename: "LocationValue" }
                    | { __typename: "InteractionValue" }
                    | { __typename: "SelectValue" }
                    | { __typename: "MultiSelectValue" }
                    | { __typename: "StatusValue" }
                    | { __typename: "CheckboxValue" }
                    | { __typename: "RatingValue" }
                    | { __typename: "PhoneNumberValue" }
                    | { __typename: "MultiPhoneNumberValue" }
                    | { __typename: "CurrencyValue" }
                    | { __typename: "ActorReferenceValue" }
                    | { __typename: "MultiActorReferenceValue" }
                    | null;
                  title:
                    | { __typename: "RecordReferenceValue" }
                    | { __typename: "MultiRecordReferenceValue" }
                    | { __typename: "PersonalNameValue" }
                    | { __typename: "TextValue"; value: string | null }
                    | { __typename: "DateValue" }
                    | { __typename: "TimestampValue" }
                    | { __typename: "NumberValue" }
                    | { __typename: "MultiEmailAddressValue" }
                    | { __typename: "DomainValue" }
                    | { __typename: "MultiDomainValue" }
                    | { __typename: "LocationValue" }
                    | { __typename: "InteractionValue" }
                    | { __typename: "SelectValue" }
                    | { __typename: "MultiSelectValue" }
                    | { __typename: "StatusValue" }
                    | { __typename: "CheckboxValue" }
                    | { __typename: "RatingValue" }
                    | { __typename: "PhoneNumberValue" }
                    | { __typename: "MultiPhoneNumberValue" }
                    | { __typename: "CurrencyValue" }
                    | { __typename: "ActorReferenceValue" }
                    | { __typename: "MultiActorReferenceValue" }
                    | null;
                }
              | {
                  id: string;
                  description:
                    | { __typename: "RecordReferenceValue" }
                    | { __typename: "MultiRecordReferenceValue" }
                    | { __typename: "PersonalNameValue" }
                    | { __typename: "TextValue"; value: string | null }
                    | { __typename: "DateValue" }
                    | { __typename: "TimestampValue" }
                    | { __typename: "NumberValue" }
                    | { __typename: "MultiEmailAddressValue" }
                    | { __typename: "DomainValue" }
                    | { __typename: "MultiDomainValue" }
                    | { __typename: "LocationValue" }
                    | { __typename: "InteractionValue" }
                    | { __typename: "SelectValue" }
                    | { __typename: "MultiSelectValue" }
                    | { __typename: "StatusValue" }
                    | { __typename: "CheckboxValue" }
                    | { __typename: "RatingValue" }
                    | { __typename: "PhoneNumberValue" }
                    | { __typename: "MultiPhoneNumberValue" }
                    | { __typename: "CurrencyValue" }
                    | { __typename: "ActorReferenceValue" }
                    | { __typename: "MultiActorReferenceValue" }
                    | null;
                  title:
                    | { __typename: "RecordReferenceValue" }
                    | { __typename: "MultiRecordReferenceValue" }
                    | { __typename: "PersonalNameValue" }
                    | { __typename: "TextValue"; value: string | null }
                    | { __typename: "DateValue" }
                    | { __typename: "TimestampValue" }
                    | { __typename: "NumberValue" }
                    | { __typename: "MultiEmailAddressValue" }
                    | { __typename: "DomainValue" }
                    | { __typename: "MultiDomainValue" }
                    | { __typename: "LocationValue" }
                    | { __typename: "InteractionValue" }
                    | { __typename: "SelectValue" }
                    | { __typename: "MultiSelectValue" }
                    | { __typename: "StatusValue" }
                    | { __typename: "CheckboxValue" }
                    | { __typename: "RatingValue" }
                    | { __typename: "PhoneNumberValue" }
                    | { __typename: "MultiPhoneNumberValue" }
                    | { __typename: "CurrencyValue" }
                    | { __typename: "ActorReferenceValue" }
                    | { __typename: "MultiActorReferenceValue" }
                    | null;
                }
              | {
                  id: string;
                  description:
                    | { __typename: "RecordReferenceValue" }
                    | { __typename: "MultiRecordReferenceValue" }
                    | { __typename: "PersonalNameValue" }
                    | { __typename: "TextValue"; value: string | null }
                    | { __typename: "DateValue" }
                    | { __typename: "TimestampValue" }
                    | { __typename: "NumberValue" }
                    | { __typename: "MultiEmailAddressValue" }
                    | { __typename: "DomainValue" }
                    | { __typename: "MultiDomainValue" }
                    | { __typename: "LocationValue" }
                    | { __typename: "InteractionValue" }
                    | { __typename: "SelectValue" }
                    | { __typename: "MultiSelectValue" }
                    | { __typename: "StatusValue" }
                    | { __typename: "CheckboxValue" }
                    | { __typename: "RatingValue" }
                    | { __typename: "PhoneNumberValue" }
                    | { __typename: "MultiPhoneNumberValue" }
                    | { __typename: "CurrencyValue" }
                    | { __typename: "ActorReferenceValue" }
                    | { __typename: "MultiActorReferenceValue" }
                    | null;
                  title:
                    | { __typename: "RecordReferenceValue" }
                    | { __typename: "MultiRecordReferenceValue" }
                    | { __typename: "PersonalNameValue" }
                    | { __typename: "TextValue"; value: string | null }
                    | { __typename: "DateValue" }
                    | { __typename: "TimestampValue" }
                    | { __typename: "NumberValue" }
                    | { __typename: "MultiEmailAddressValue" }
                    | { __typename: "DomainValue" }
                    | { __typename: "MultiDomainValue" }
                    | { __typename: "LocationValue" }
                    | { __typename: "InteractionValue" }
                    | { __typename: "SelectValue" }
                    | { __typename: "MultiSelectValue" }
                    | { __typename: "StatusValue" }
                    | { __typename: "CheckboxValue" }
                    | { __typename: "RatingValue" }
                    | { __typename: "PhoneNumberValue" }
                    | { __typename: "MultiPhoneNumberValue" }
                    | { __typename: "CurrencyValue" }
                    | { __typename: "ActorReferenceValue" }
                    | { __typename: "MultiActorReferenceValue" }
                    | null;
                }
              | {
                  id: string;
                  description:
                    | { __typename: "RecordReferenceValue" }
                    | { __typename: "MultiRecordReferenceValue" }
                    | { __typename: "PersonalNameValue" }
                    | { __typename: "TextValue"; value: string | null }
                    | { __typename: "DateValue" }
                    | { __typename: "TimestampValue" }
                    | { __typename: "NumberValue" }
                    | { __typename: "MultiEmailAddressValue" }
                    | { __typename: "DomainValue" }
                    | { __typename: "MultiDomainValue" }
                    | { __typename: "LocationValue" }
                    | { __typename: "InteractionValue" }
                    | { __typename: "SelectValue" }
                    | { __typename: "MultiSelectValue" }
                    | { __typename: "StatusValue" }
                    | { __typename: "CheckboxValue" }
                    | { __typename: "RatingValue" }
                    | { __typename: "PhoneNumberValue" }
                    | { __typename: "MultiPhoneNumberValue" }
                    | { __typename: "CurrencyValue" }
                    | { __typename: "ActorReferenceValue" }
                    | { __typename: "MultiActorReferenceValue" }
                    | null;
                  title:
                    | { __typename: "RecordReferenceValue" }
                    | { __typename: "MultiRecordReferenceValue" }
                    | { __typename: "PersonalNameValue" }
                    | { __typename: "TextValue"; value: string | null }
                    | { __typename: "DateValue" }
                    | { __typename: "TimestampValue" }
                    | { __typename: "NumberValue" }
                    | { __typename: "MultiEmailAddressValue" }
                    | { __typename: "DomainValue" }
                    | { __typename: "MultiDomainValue" }
                    | { __typename: "LocationValue" }
                    | { __typename: "InteractionValue" }
                    | { __typename: "SelectValue" }
                    | { __typename: "MultiSelectValue" }
                    | { __typename: "StatusValue" }
                    | { __typename: "CheckboxValue" }
                    | { __typename: "RatingValue" }
                    | { __typename: "PhoneNumberValue" }
                    | { __typename: "MultiPhoneNumberValue" }
                    | { __typename: "CurrencyValue" }
                    | { __typename: "ActorReferenceValue" }
                    | { __typename: "MultiActorReferenceValue" }
                    | null;
                }
              | {
                  id: string;
                  description:
                    | { __typename: "RecordReferenceValue" }
                    | { __typename: "MultiRecordReferenceValue" }
                    | { __typename: "PersonalNameValue" }
                    | { __typename: "TextValue"; value: string | null }
                    | { __typename: "DateValue" }
                    | { __typename: "TimestampValue" }
                    | { __typename: "NumberValue" }
                    | { __typename: "MultiEmailAddressValue" }
                    | { __typename: "DomainValue" }
                    | { __typename: "MultiDomainValue" }
                    | { __typename: "LocationValue" }
                    | { __typename: "InteractionValue" }
                    | { __typename: "SelectValue" }
                    | { __typename: "MultiSelectValue" }
                    | { __typename: "StatusValue" }
                    | { __typename: "CheckboxValue" }
                    | { __typename: "RatingValue" }
                    | { __typename: "PhoneNumberValue" }
                    | { __typename: "MultiPhoneNumberValue" }
                    | { __typename: "CurrencyValue" }
                    | { __typename: "ActorReferenceValue" }
                    | { __typename: "MultiActorReferenceValue" }
                    | null;
                  title:
                    | { __typename: "RecordReferenceValue" }
                    | { __typename: "MultiRecordReferenceValue" }
                    | { __typename: "PersonalNameValue" }
                    | { __typename: "TextValue"; value: string | null }
                    | { __typename: "DateValue" }
                    | { __typename: "TimestampValue" }
                    | { __typename: "NumberValue" }
                    | { __typename: "MultiEmailAddressValue" }
                    | { __typename: "DomainValue" }
                    | { __typename: "MultiDomainValue" }
                    | { __typename: "LocationValue" }
                    | { __typename: "InteractionValue" }
                    | { __typename: "SelectValue" }
                    | { __typename: "MultiSelectValue" }
                    | { __typename: "StatusValue" }
                    | { __typename: "CheckboxValue" }
                    | { __typename: "RatingValue" }
                    | { __typename: "PhoneNumberValue" }
                    | { __typename: "MultiPhoneNumberValue" }
                    | { __typename: "CurrencyValue" }
                    | { __typename: "ActorReferenceValue" }
                    | { __typename: "MultiActorReferenceValue" }
                    | null;
                }
              | null;
          }
        | { __typename: "MultiRecordReferenceValue" }
        | { __typename: "PersonalNameValue" }
        | { __typename: "TextValue" }
        | { __typename: "DateValue" }
        | { __typename: "TimestampValue" }
        | { __typename: "NumberValue" }
        | { __typename: "MultiEmailAddressValue" }
        | { __typename: "DomainValue" }
        | { __typename: "MultiDomainValue" }
        | { __typename: "LocationValue" }
        | { __typename: "InteractionValue" }
        | { __typename: "SelectValue" }
        | { __typename: "MultiSelectValue" }
        | { __typename: "StatusValue" }
        | { __typename: "CheckboxValue" }
        | { __typename: "RatingValue" }
        | { __typename: "PhoneNumberValue" }
        | { __typename: "MultiPhoneNumberValue" }
        | { __typename: "CurrencyValue" }
        | { __typename: "ActorReferenceValue" }
        | { __typename: "MultiActorReferenceValue" }
        | null;
      fit_score:
        | { __typename: "RecordReferenceValue" }
        | { __typename: "MultiRecordReferenceValue" }
        | { __typename: "PersonalNameValue" }
        | { __typename: "TextValue" }
        | { __typename: "DateValue" }
        | { __typename: "TimestampValue" }
        | { __typename: "NumberValue"; value: number | null }
        | { __typename: "MultiEmailAddressValue" }
        | { __typename: "DomainValue" }
        | { __typename: "MultiDomainValue" }
        | { __typename: "LocationValue" }
        | { __typename: "InteractionValue" }
        | { __typename: "SelectValue" }
        | { __typename: "MultiSelectValue" }
        | { __typename: "StatusValue" }
        | { __typename: "CheckboxValue" }
        | { __typename: "RatingValue" }
        | { __typename: "PhoneNumberValue" }
        | { __typename: "MultiPhoneNumberValue" }
        | { __typename: "CurrencyValue" }
        | { __typename: "ActorReferenceValue" }
        | { __typename: "MultiActorReferenceValue" }
        | null;
      fit_tier:
        | { __typename: "RecordReferenceValue" }
        | { __typename: "MultiRecordReferenceValue" }
        | { __typename: "PersonalNameValue" }
        | { __typename: "TextValue" }
        | { __typename: "DateValue" }
        | { __typename: "TimestampValue" }
        | { __typename: "NumberValue" }
        | { __typename: "MultiEmailAddressValue" }
        | { __typename: "DomainValue" }
        | { __typename: "MultiDomainValue" }
        | { __typename: "LocationValue" }
        | { __typename: "InteractionValue" }
        | { __typename: "SelectValue"; value: { title: string } | null }
        | { __typename: "MultiSelectValue" }
        | { __typename: "StatusValue" }
        | { __typename: "CheckboxValue" }
        | { __typename: "RatingValue" }
        | { __typename: "PhoneNumberValue" }
        | { __typename: "MultiPhoneNumberValue" }
        | { __typename: "CurrencyValue" }
        | { __typename: "ActorReferenceValue" }
        | { __typename: "MultiActorReferenceValue" }
        | null;
      two_liner:
        | { __typename: "RecordReferenceValue" }
        | { __typename: "MultiRecordReferenceValue" }
        | { __typename: "PersonalNameValue" }
        | { __typename: "TextValue"; value: string | null }
        | { __typename: "DateValue" }
        | { __typename: "TimestampValue" }
        | { __typename: "NumberValue" }
        | { __typename: "MultiEmailAddressValue" }
        | { __typename: "DomainValue" }
        | { __typename: "MultiDomainValue" }
        | { __typename: "LocationValue" }
        | { __typename: "InteractionValue" }
        | { __typename: "SelectValue" }
        | { __typename: "MultiSelectValue" }
        | { __typename: "StatusValue" }
        | { __typename: "CheckboxValue" }
        | { __typename: "RatingValue" }
        | { __typename: "PhoneNumberValue" }
        | { __typename: "MultiPhoneNumberValue" }
        | { __typename: "CurrencyValue" }
        | { __typename: "ActorReferenceValue" }
        | { __typename: "MultiActorReferenceValue" }
        | null;
      audio_summary_script:
        | { __typename: "RecordReferenceValue" }
        | { __typename: "MultiRecordReferenceValue" }
        | { __typename: "PersonalNameValue" }
        | { __typename: "TextValue"; value: string | null }
        | { __typename: "DateValue" }
        | { __typename: "TimestampValue" }
        | { __typename: "NumberValue" }
        | { __typename: "MultiEmailAddressValue" }
        | { __typename: "DomainValue" }
        | { __typename: "MultiDomainValue" }
        | { __typename: "LocationValue" }
        | { __typename: "InteractionValue" }
        | { __typename: "SelectValue" }
        | { __typename: "MultiSelectValue" }
        | { __typename: "StatusValue" }
        | { __typename: "CheckboxValue" }
        | { __typename: "RatingValue" }
        | { __typename: "PhoneNumberValue" }
        | { __typename: "MultiPhoneNumberValue" }
        | { __typename: "CurrencyValue" }
        | { __typename: "ActorReferenceValue" }
        | { __typename: "MultiActorReferenceValue" }
        | null;
    } | null;
  };

  const value: Query<
    GetCandidateContextQueryVariables,
    GetCandidateContextQuery
  >;
  export default value;
}
