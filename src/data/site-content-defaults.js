import {
  aboutInstagramPosts,
  featuredCampaign,
  instagramPosts,
  partnerNames,
  services,
  testimonials,
} from "./content";

export const siteContentDefaults = {
  hero: {
    eyebrowLeft: "Independent creative production",
    eyebrowRight: "Brands · Events · Talent",
    identity: "BARDAPURE",
    descriptor: "PRODUCTIONS®",
    tagline: "Explore your ambitions.",
    supportingLine: "Make ideas happen.",
  },
  home_intro: {
    eyebrow: "Bardapure Productions® / Since 2018",
    title: "Ideas into",
    highlight: "real experiences.",
    description:
      "Brand activations, events and content—planned with care, made with people, delivered on the ground.",
  },
  about: {
    headline: "Good work starts with",
    highlight: "people.",
    description:
      "From campus activations to creator-led campaigns, Bardapure brings brands and people together to make work happen on the ground.",
    vision: "A trusted home for talent, brands and opportunity.",
    mission: "Bring great people together to make memorable work.",
    portrait: "/images/founder-portrait-event.jpeg",
    socialHeadline: "People behind",
    socialHighlight: "the work.",
    socialDescription: "Brand collaborations and moments of recognition shared by the team.",
    posts: aboutInstagramPosts,
    featuredCampaign,
  },
  achievements: {
    note: "From local projects to campaigns across India.",
    items: [
      { value: "Brands", label: "Campaigns & activations" },
      { value: "Creators", label: "Talent & collaboration" },
      { value: "Campuses", label: "Community & connection" },
      { value: "2026—now", label: "Creative journey" },
    ],
  },
  services,
  portfolio: instagramPosts,
  partners: partnerNames,
  testimonials,
  site_settings: {
    email: "",
    phone: "",
    address: "",
    instagram: "https://www.instagram.com/bardapure_production_official/",
    founderInstagram: "https://www.instagram.com/sagar_bardapure_official/",
  },
};
