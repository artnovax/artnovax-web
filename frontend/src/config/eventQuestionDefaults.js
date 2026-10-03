// Standard ArtNovaX event registration and feedback questions.
// These mirror the official participant registration and participant feedback forms.

export const DEFAULT_EVENT_REGISTRATION_QUESTIONS = [
  {
    id: "age",
    label: "Age",
    type: "number",
    required: false,
    options: [],
  },
  {
    id: "gender",
    label: "Gender",
    type: "radio",
    required: false,
    options: ["Female", "Male", "Non-binary", "Prefer not to say", "Other"],
  },
  {
    id: "current_location",
    label: "Where do you currently live?",
    type: "text",
    required: false,
    options: [],
  },
  {
    id: "participant_status",
    label: "What best describes you?",
    type: "radio",
    required: false,
    options: [
      "University/college student",
      "Working",
      "Self-employed/business owner",
      "Currently not working/studying",
      "Other",
    ],
  },
  {
    id: "institution",
    label: "If you are a student, what institution do you attend?",
    type: "text",
    required: false,
    options: [],
  },
  {
    id: "prior_participation",
    label: "Have you participated in an ArtNovaX activity before?",
    type: "radio",
    required: false,
    options: ["Yes", "No"],
  },
  {
    id: "referral",
    label: "How did you hear about ArtNovaX?",
    type: "radio",
    required: false,
    options: [
      "Instagram/social media",
      "Friend/family",
      "University/student organisation",
      "ArtNovaX event",
      "Partner organisation",
      "Other",
    ],
  },
  {
    id: "creative_frequency",
    label: "How often do you engage in creative activities?",
    type: "radio",
    required: false,
    options: ["Daily", "Several times a week", "Once a week", "Occasionally", "Rarely/Never"],
  },
  {
    id: "creative_interests",
    label: "Which creative activities are you interested in?",
    type: "checkbox-group",
    required: false,
    options: [
      "Drawing",
      "Painting",
      "Colouring",
      "Music",
      "Writing/poetry",
      "Photography",
      "Crafts",
      "Dance",
      "Other",
    ],
  },
  {
    id: "desired_outcomes",
    label: "What would you like to gain from participating in ArtNovaX activities?",
    type: "textarea",
    required: false,
    options: [],
  },
];

export const DEFAULT_EVENT_FEEDBACK_QUESTIONS = [
  {
    id: "activity_participated",
    label: "Which ArtNovaX activity did you participate in?",
    type: "text",
    required: false,
    options: [],
    systemValue: "event_title",
    readOnly: true,
    help: "Filled automatically from this event.",
  },
  {
    id: "overall_experience",
    label: "How would you rate your overall experience?",
    type: "radio",
    required: false,
    options: ["1 - Very poor", "2 - Poor", "3 - Okay", "4 - Good", "5 - Excellent"],
  },
  {
    id: "feelings_during_activity",
    label: "How did you feel during the activity?",
    type: "checkbox-group",
    required: false,
    options: [
      "Relaxed",
      "Happy",
      "Calm",
      "Connected to others",
      "Creative",
      "Curious",
      "Neutral",
      "Uncomfortable",
      "Other",
    ],
  },
  {
    id: "enjoyment",
    label: "How much did you enjoy the activity?",
    type: "radio",
    required: false,
    options: ["1 - Not at all", "2 - A little", "3 - Somewhat", "4 - A lot", "5 - Very much"],
  },
  {
    id: "current_mood",
    label: "After the activity, how would you describe your current mood?",
    type: "radio",
    required: false,
    options: ["1 - Very low", "2 - Low", "3 - Neutral", "4 - Good", "5 - Very good"],
  },
  {
    id: "creative_expression",
    label: "Did the activity give you an opportunity to express yourself creatively?",
    type: "radio",
    required: false,
    options: ["Yes, definitely", "Somewhat", "Not really", "Not at all"],
  },
  {
    id: "inclusion",
    label: "Did you feel comfortable and included during the activity?",
    type: "radio",
    required: false,
    options: ["Yes", "Somewhat", "No"],
  },
  {
    id: "self_discovery",
    label: "Did you learn or discover anything about yourself through the activity?",
    type: "radio",
    required: false,
    options: ["Yes", "Maybe", "No"],
  },
  {
    id: "return_intent",
    label: "Would you participate in another ArtNovaX activity?",
    type: "radio",
    required: false,
    options: ["Definitely", "Probably", "Maybe", "Probably not", "No"],
  },
  {
    id: "enjoyed_most",
    label: "What did you enjoy most about today's activity?",
    type: "textarea",
    required: false,
    options: [],
  },
  {
    id: "improvements",
    label: "What could we improve?",
    type: "textarea",
    required: false,
    options: [],
  },
  {
    id: "future_offerings",
    label: "Is there anything you would like ArtNovaX to offer in future?",
    type: "textarea",
    required: false,
    options: [],
  },
  {
    id: "additional_feedback",
    label: "Is there anything else you would like us to know?",
    type: "textarea",
    required: false,
    options: [],
  },
];

export const cloneQuestionSet = (questions = []) =>
  (Array.isArray(questions) ? questions : []).map((question) => ({
    ...question,
    options: Array.isArray(question.options) ? [...question.options] : [],
  }));

export const mergeMissingQuestions = (questions = [], defaults = []) => {
  const existing = cloneQuestionSet(questions);
  const existingIds = new Set(existing.map((question) => question.id).filter(Boolean));
  const missing = cloneQuestionSet(defaults).filter(
    (question) => !question.id || !existingIds.has(question.id),
  );
  return [...existing, ...missing];
};
