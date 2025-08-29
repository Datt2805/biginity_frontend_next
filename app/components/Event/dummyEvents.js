export const dummyEvents = [
  {
    _id: "1",
    title: "AI Conference 2025",
    start_time: "2025-09-01T10:00:00",
    end_time: "2025-09-01T17:00:00",
    location: { address: "New York City, NY" },
    description: {
      objectives: [
        "Discuss the latest AI breakthroughs",
        "Explore ethical implications of AI",
      ],
      learning_outcomes: [
        "Understand AI applications in industry",
        "Gain insights into future AI trends",
      ],
    },
    speakers: [
      {
        id: "s1",
        name: "Dr. Alice Johnson",
        organization: "MIT",
        profile: "",
      },
      {
        id: "s2",
        name: "Mr. Bob Smith",
        organization: "Google AI",
        profile: "",
      },
    ],
  },
  {
    _id: "2",
    title: "Web Dev Summit",
    start_time: "2025-09-10T09:00:00",
    end_time: "2025-09-10T15:00:00",
    location: { address: "San Francisco, CA" },
    description: {
      objectives: [
        "Cover modern frontend frameworks",
        "Introduce Next.js best practices",
      ],
      learning_outcomes: [
        "Build scalable web apps",
        "Adopt server-side rendering effectively",
      ],
    },
    speakers: [
      {
        id: "s3",
        name: "Jane Doe",
        organization: "Vercel",
        profile: "",
      },
    ],
  },
];
