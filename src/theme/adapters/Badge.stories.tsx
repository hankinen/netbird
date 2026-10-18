import Badge from "@components/Badge";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FolderGit2, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { padded, Row, Stack } from "@/storybook/components";
import { TAG_ROLE } from "@/theme/adapters/Badge";

/* The adapter behind "@components/Badge": every upstream variant grouped by
   the AntD tag role it maps to (data-nb-tag), both sizes, hover and
   disabled. Components/Badge (upstream's story) keeps the upstream grid. */
const meta: Meta<typeof Badge> = {
  title: "Theme/Adapters/Badge",
  component: Badge,
  decorators: [padded],
};
export default meta;

type Variant = keyof typeof TAG_ROLE;
const variants = Object.keys(TAG_ROLE) as Variant[];
const roles = [...new Set(Object.values(TAG_ROLE))];

function Roles() {
  return (
    <Stack>
      {roles.map((role) => (
        <Row key={role} label={role}>
          {variants
            .filter((v) => TAG_ROLE[v] === role)
            .map((variant) => (
              <Badge key={variant} variant={variant}>
                <ShieldCheck size={12} />
                {variant}
              </Badge>
            ))}
          <Badge
            variant={variants.find((v) => TAG_ROLE[v] === role)}
            size={"xs"}
          >
            xs
          </Badge>
          <Badge variant={variants.find((v) => TAG_ROLE[v] === role)} disabled>
            disabled
          </Badge>
        </Row>
      ))}
    </Stack>
  );
}

export const ByRole: StoryObj = {
  tags: ["capture-hover"],
  render: () => <Roles />,
};

export const ByRolePhone: StoryObj = {
  tags: ["vp-390"],
  render: () => <Roles />,
};

export const InContext: StoryObj = {
  render: () => (
    <Stack>
      <Row label={"groups (hover)"}>
        <Badge variant={"gray"} useHover>
          <FolderGit2 size={12} />2 Groups
        </Badge>
        <Badge variant={"gray"} useHover>
          <FolderGit2 size={12} />
          Office New York
        </Badge>
      </Row>
      <Row label={"counts"}>
        <Badge variant={"blue"} size={"xs"}>
          3
        </Badge>
        <Badge variant={"gray-ghost"} size={"xs"}>
          <MonitorSmartphone size={11} />4 peers
        </Badge>
      </Row>
      <Row label={"status"}>
        <Badge variant={"green"}>Connected</Badge>
        <Badge variant={"yellow"}>Pending approval</Badge>
        <Badge variant={"red"}>Login expired</Badge>
        <Badge variant={"purple"}>Routing peer</Badge>
      </Row>
    </Stack>
  ),
};
