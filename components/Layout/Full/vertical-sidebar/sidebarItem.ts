import {
  LayoutDashboardIcon,
  BorderAllIcon,
  AlertCircleIcon,
  CircleDotIcon,
  BoxMultiple1Icon,
  LoginIcon,
  MoodHappyIcon,
  ApertureIcon,
  UserPlusIcon,
} from "vue-tabler-icons";

export interface menu {
  header?: string;
  title?: string;
  icon?: any;
  to?: string;
  chip?: string;
  BgColor?: string;
  chipBgColor?: string;
  chipColor?: string;
  chipVariant?: string;
  chipIcon?: string;
  children?: menu[];
  disabled?: boolean;
  type?: string;
  subCaption?: string;
  external?: boolean;
}

const sidebarItem: menu[] = [
  { header: "Home" },
  {
    title: "Dashboard",
    icon: "graph-new-linear",
    to: "/",
  },
  { header: "Management" },
  {
    title: "Users",
    icon: "users-group-rounded-line-duotone",
    to: "/users",
  },
  { header: "ui" },
  {
    title: "Alert",
    icon: "volume-small-broken",
    to: "/ui-components/alerts",
  },
  {
    title: "Button",
    icon: "tag-horizontal-outline",
    to: "/ui-components/buttons",
  },
  {
    title: "Cards",
    icon: "cardholder-linear",
    to: "/ui-components/cards",
  },
  {
    title: "Tables",
    icon: "suspension-outline",
    to: "/ui-components/tables",
  },
  {
    title: "Authentication",
    icon: "shield-user-line-duotone",
    to: "/auth/",
    children: [
      {
        title: "Login",
        to: "/auth/login",
      },
      {
        title: "Register",
        to: "/auth/register",
      },
      {
        title: "Forgot Password",
        to: "/auth/forgot-password",
      },
      {
        title: "Two Steps",
        to: "/auth/two-steps",
      },
      {
        title: "Error",
        to: "/auth/error",
      },
      {
        title: "Maintenance",
        to: "/auth/maintenance",
      },
    ],
  },
  {
    title: "Error",
    icon: "alert-circle-line-duotone",
    to: "/error",
  },
];

export default sidebarItem;
