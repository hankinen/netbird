import { Input } from "@components/Input";
import { Textarea } from "@components/Textarea";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search } from "lucide-react";
import { padded, Row, Stack } from "@/storybook/components";

/* The adapters behind "@components/Input" and "@components/Textarea": the
   states css/input.css styles (default, icon + suffix, prefix box, error
   inline and as a tooltip, disabled, read-only, password) at desktop and
   phone density. Components/Input (upstream's story) keeps the upstream
   grid. */
const meta: Meta<typeof Input> = {
  title: "Theme/Adapters/Input",
  component: Input,
  decorators: [padded],
};
export default meta;

function States() {
  return (
    <Stack>
      <Row label={"default"} className={"flex flex-col gap-3 w-80"}>
        <Input placeholder={"Peer name"} />
        <Input defaultValue={"router-berlin"} />
      </Row>
      <Row label={"icon + suffix"} className={"flex flex-col gap-3 w-80"}>
        <Input
          placeholder={"Search by name, IP, MAC…"}
          icon={<Search size={15} />}
          customSuffix={<span className={"text-xs"}>⌘ K</span>}
        />
      </Row>
      <Row label={"prefix"} className={"flex flex-col gap-3 w-80"}>
        <Input customPrefix={"https://"} placeholder={"example.com"} />
      </Row>
      <Row label={"error"} className={"flex flex-col gap-3 w-80"}>
        <Input defaultValue={"300.1.1.1"} error={"Not a valid IP address"} />
        <Input
          defaultValue={"300.1.1.1"}
          error={"Not a valid IP address"}
          errorTooltip
        />
      </Row>
      <Row
        label={"disabled / read-only"}
        className={"flex flex-col gap-3 w-80"}
      >
        <Input defaultValue={"disabled"} disabled />
        <Input defaultValue={"read-only"} readOnly />
      </Row>
      <Row label={"password"} className={"flex flex-col gap-3 w-80"}>
        <Input type={"password"} defaultValue={"secret"} showPasswordToggle />
      </Row>
      <Row label={"textarea"} className={"flex flex-col gap-3 w-80"}>
        <Textarea placeholder={"Description"} rows={3} />
        <Textarea defaultValue={"Too long"} error={"At most 120 characters"} />
        <Textarea defaultValue={"disabled"} disabled rows={2} />
      </Row>
    </Stack>
  );
}

export const Desktop: StoryObj = {
  tags: ["capture-focus"],
  render: () => <States />,
};

export const Phone: StoryObj = {
  tags: ["vp-390"],
  render: () => <States />,
};
