import Button from "@components/Button";
import ButtonGroup from "@components/ButtonGroup";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MoreVertical, PlusCircle, RefreshCw, Trash2 } from "lucide-react";
import { padded, Row, Stack } from "@/storybook/components";
import { BUTTON_ROLE, BUTTON_SIZE } from "@/theme/adapters/Button";

/* The adapter behind "@components/Button": every upstream variant with the
   AntD role it maps to (data-nb-btn), the three sizes, and the states the
   theme styles. Components/Button (upstream's story) still captures the
   upstream variant grid; this one is grouped by role so a reviewer sees each
   role once. vp-390 captures the phone density (40px controls). */
const meta: Meta<typeof Button> = {
  title: "Theme/Adapters/Button",
  component: Button,
  decorators: [padded],
};
export default meta;

type Variant = keyof typeof BUTTON_ROLE;
const variants = Object.keys(BUTTON_ROLE) as Variant[];
const roles = [...new Set(Object.values(BUTTON_ROLE))];

function Roles() {
  return (
    <Stack>
      {roles.map((role) => (
        <Row key={role} label={role}>
          {variants
            .filter((v) => BUTTON_ROLE[v] === role)
            .map((variant) => (
              <Button key={variant} variant={variant} title={variant}>
                <PlusCircle size={16} />
                {variant}
              </Button>
            ))}
          <Button
            variant={variants.find((v) => BUTTON_ROLE[v] === role)}
            disabled
          >
            disabled
          </Button>
        </Row>
      ))}
    </Stack>
  );
}

export const ByRole: StoryObj = {
  tags: ["capture-hover", "capture-focus"],
  render: () => <Roles />,
};

export const ByRolePhone: StoryObj = {
  tags: ["vp-390"],
  render: () => <Roles />,
};

export const Sizes: StoryObj = {
  render: () => (
    <Stack>
      {(["primary", "secondary", "default-outline"] as const).map((variant) => (
        <Row key={variant} label={variant}>
          {(Object.keys(BUTTON_SIZE) as (keyof typeof BUTTON_SIZE)[]).map(
            (size) => (
              <Button key={size} variant={variant} size={size}>
                <PlusCircle size={14} />
                {size} → {BUTTON_SIZE[size]}
              </Button>
            ),
          )}
        </Row>
      ))}
    </Stack>
  ),
};

export const IconOnlyAndGroups: StoryObj = {
  render: () => (
    <Stack>
      <Row label={"icon only"}>
        <Button variant={"secondary"} className={"px-3"}>
          <RefreshCw size={16} />
        </Button>
        <Button variant={"default-outline"} className={"!px-2"}>
          <MoreVertical size={16} />
        </Button>
        <Button variant={"danger-outline"} size={"xs"} className={"!px-3"}>
          <Trash2 size={14} />
        </Button>
      </Row>
      <Row label={"group"}>
        <ButtonGroup>
          <ButtonGroup.Button variant={"tertiary"}>
            User Devices
          </ButtonGroup.Button>
          <ButtonGroup.Button variant={"secondary"} className={"!border-l-0"}>
            Servers
          </ButtonGroup.Button>
        </ButtonGroup>
        <ButtonGroup disabled>
          <ButtonGroup.Button variant={"secondary"} disabled>
            Off
          </ButtonGroup.Button>
          <ButtonGroup.Button variant={"secondary"} disabled>
            Off
          </ButtonGroup.Button>
        </ButtonGroup>
      </Row>
      <Row label={"inline"}>
        <span className={"text-sm"}>A row of text with an</span>
        <Button variant={"danger-text"} size={"xs"}>
          inline delete
        </Button>
      </Row>
    </Stack>
  ),
};
