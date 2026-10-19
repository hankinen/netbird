import type { Meta } from "@storybook/nextjs-vite";
import {
  FolderGit2,
  MonitorIcon,
  NetworkIcon,
  WorkflowIcon,
} from "lucide-react";
import React from "react";
import type { Story } from "@/storybook/core";
import {
  GraphDock,
  GraphDockButton,
  GraphDockDivider,
  GraphDockGroup,
} from "./GraphDock";
import { GraphDefs } from "./GraphEdge";
import { GraphFrame } from "./GraphFrame";
import { EdgeSwatch, GraphLegend } from "./GraphLegend";
import { GraphNodeCard, type GraphNodeState } from "./GraphNodeCard";
import { GraphPill } from "./GraphPill";
import { GraphSegmented } from "./GraphSegmented";
import { GraphDot, GraphTag } from "./GraphTag";

/* The graph layer's primitives on their own, outside any page: every node
   kind and state, the pill, a frame, the edge tones, the dock and the
   segmented control. The visual guard renders them in both colour modes. */
const meta: Meta = {
  title: "Theme/Graph",
  decorators: [
    (StoryFn) => (
      <div
        style={{
          padding: 32,
          background: "var(--graph-bg)",
          minHeight: "100vh",
          color: "var(--ant-color-text)",
        }}
      >
        <GraphDefs />
        <StoryFn />
      </div>
    ),
  ],
};
export default meta;

const Row = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section style={{ marginBottom: 28 }}>
    <h3
      style={{
        margin: "0 0 12px",
        fontSize: 13,
        fontWeight: 600,
        opacity: 0.6,
      }}
    >
      {title}
    </h3>
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      {children}
    </div>
  </section>
);

const STATES: { name: string; state: GraphNodeState }[] = [
  { name: "default", state: {} },
  { name: "selected", state: { selected: true } },
  { name: "drop target", state: { dropTarget: true } },
  { name: "disabled", state: { disabled: true } },
  { name: "draft", state: { draft: true } },
  { name: "deleting", state: { deleting: true } },
];

export const NodeCards: Story = {
  render: () => (
    <>
      <Row title={"Kinds"}>
        <GraphNodeCard
          kind={"peer"}
          icon={<MonitorIcon size={16} />}
          title={"olivias-macbook-pro"}
          meta={"100.92.14.21"}
          interactive
        />
        <GraphNodeCard
          kind={"group"}
          icon={<FolderGit2 size={16} />}
          title={"Developers"}
          meta={"5 Peers, 3 Users"}
          interactive
        />
        <GraphNodeCard
          kind={"resource"}
          icon={<WorkflowIcon size={16} />}
          title={"Production Postgres"}
          titleExtra={<GraphTag>AWS Production</GraphTag>}
          meta={"10.0.12.5/32"}
          interactive
        />
        <GraphNodeCard
          kind={"provider"}
          icon={<NetworkIcon size={16} />}
          title={"Anthropic Claude"}
          meta={"https://api.anthropic.com"}
          interactive
        />
      </Row>
      <Row title={"States"}>
        {STATES.map(({ name, state }) => (
          <GraphNodeCard
            key={name}
            kind={"group"}
            icon={<FolderGit2 size={16} />}
            title={name}
            titleExtra={
              state.draft ? (
                <GraphTag tone={"draft"}>Draft</GraphTag>
              ) : undefined
            }
            meta={"3 Peers, 1 User"}
            state={state}
            interactive
          />
        ))}
      </Row>
      <Row title={"Plain and row variants"}>
        <GraphNodeCard
          kind={"peer"}
          variant={"plain"}
          icon={<MonitorIcon size={16} />}
          title={"plain, hover for a card"}
          meta={"100.92.0.8"}
          interactive
        />
        <div style={{ width: 240, height: 58 }}>
          <GraphNodeCard
            kind={"resource"}
            variant={"row"}
            icon={<WorkflowIcon size={16} />}
            title={"row inside a frame"}
            meta={"192.168.1.20/32"}
            interactive
          />
        </div>
        <div style={{ width: 240, height: 58 }}>
          <GraphNodeCard
            kind={"resource"}
            variant={"row"}
            icon={<WorkflowIcon size={16} />}
            title={"selected row"}
            meta={"192.168.1.20/32"}
            state={{ selected: true }}
            interactive
          />
        </div>
      </Row>
      <Row title={"Warning action above the card"}>
        <div style={{ paddingTop: 48 }}>
          <GraphNodeCard
            kind={"resource"}
            icon={<WorkflowIcon size={16} />}
            title={"wiki"}
            meta={"wiki.office.example.com"}
            state={{ draft: true, warning: true }}
            action={
              <button className={"nb-graph-chrome__button"} type={"button"}>
                No Network
              </button>
            }
            interactive
          />
        </div>
      </Row>
    </>
  ),
};

export const Pills: Story = {
  render: () => (
    <Row title={"Policies"}>
      <GraphPill name={"Default"} tag={"All"} />
      <GraphPill
        name={"Databases from DevOps"}
        tag={"TCP:3306,5432,6379,27017, ..."}
      />
      <GraphPill name={"Disabled rule"} tag={"UDP:53"} on={false} />
      <GraphPill name={"Selected"} tag={"TCP:22"} state={{ selected: true }} />
      <GraphPill
        name={"New in the draft"}
        nameExtra={<GraphTag tone={"draft"}>Draft</GraphTag>}
        tag={"TCP:443"}
        state={{ draft: true }}
      />
      <GraphPill name={"Everyone → self-hosted models"} />
    </Row>
  ),
};

export const Frame: Story = {
  render: () => (
    <Row title={"Network frame"}>
      <div style={{ width: 410, height: 260, marginTop: 56 }}>
        <GraphFrame
          icon={<NetworkIcon size={16} />}
          title={"AWS Production VPC (eu-central-1)"}
          meta={"3 Resources"}
          interactive
          controls={
            <span className={"nb-graph-pill"} style={{ height: 30 }}>
              <GraphDot /> 1 Routing Peer
            </span>
          }
        >
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 86,
              width: 185,
              height: 58,
            }}
          >
            <GraphNodeCard
              kind={"resource"}
              variant={"row"}
              tileClassName={"cc-frame-row-icon"}
              icon={<WorkflowIcon size={16} />}
              title={"Production Postgres"}
              meta={"10.0.12.5/32"}
              interactive
            />
          </div>
          <div
            style={{
              position: "absolute",
              left: 205,
              top: 86,
              width: 185,
              height: 58,
            }}
          >
            <GraphNodeCard
              kind={"resource"}
              variant={"row"}
              icon={<NetworkIcon size={16} />}
              title={"Production VPC"}
              meta={"10.0.0.0/16"}
              interactive
            />
          </div>
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 148,
              width: 185,
              height: 58,
            }}
          >
            <GraphNodeCard
              kind={"resource"}
              variant={"row"}
              icon={<WorkflowIcon size={16} />}
              title={"S3 Endpoint"}
              meta={"s3.eu-central-1.amazonaws.com"}
              interactive
            />
          </div>
        </GraphFrame>
      </div>
      <div style={{ width: 340, height: 200, marginTop: 56 }}>
        <GraphFrame
          icon={<NetworkIcon size={16} />}
          title={"Staging"}
          meta={"No resources"}
          state={{ selected: true }}
          interactive
        />
      </div>
    </Row>
  ),
};

export const Edges: Story = {
  render: () => (
    <>
      <Row title={"Edge tones"}>
        <GraphLegend
          rows={[
            {
              key: "a",
              swatch: <EdgeSwatch />,
              label: "Allowed, source to destination",
            },
            {
              key: "b",
              swatch: <EdgeSwatch direction={"both"} />,
              label: "Both directions",
            },
            {
              key: "c",
              swatch: <EdgeSwatch tone={"disabled"} />,
              label: "Disabled policy",
            },
            {
              key: "d",
              swatch: <EdgeSwatch tone={"draft"} />,
              label: "Pending change",
            },
            {
              key: "e",
              swatch: <EdgeSwatch tone={"emphasis"} />,
              label: "Hovered endpoint",
            },
          ]}
        />
      </Row>
      <Row title={"At canvas scale"}>
        <svg width={420} height={160} viewBox={"0 0 420 160"}>
          <path
            className={"nb-graph-edge"}
            d={"M20 30 C 200 30, 220 130, 400 130"}
            markerEnd={"url(#nb-graph-arrow)"}
          />
          <path
            className={"nb-graph-edge"}
            data-emphasis={"hover"}
            d={"M20 80 C 200 80, 220 60, 400 60"}
            markerEnd={"url(#nb-graph-arrow-emphasis)"}
            style={{ animation: "none" }}
          />
          <path
            className={"nb-graph-edge"}
            data-disabled={""}
            d={"M20 130 C 200 130, 220 30, 400 30"}
            markerEnd={"url(#nb-graph-arrow-disabled)"}
          />
        </svg>
      </Row>
    </>
  ),
};

export const DockAndControls: Story = {
  render: () => (
    <>
      <Row title={"Dock"}>
        <GraphDock>
          <GraphDockGroup position={"first"}>
            <GraphDockButton
              variant={"primary"}
              tooltip={"Add components"}
              shortcut={"C"}
            >
              + Add
            </GraphDockButton>
          </GraphDockGroup>
          <GraphDockDivider />
          <GraphDockGroup>
            <GraphDockButton tooltip={"Select"} shortcut={"V"} active>
              <MonitorIcon size={16} />
            </GraphDockButton>
            <GraphDockButton tooltip={"Hand"} shortcut={"H"}>
              <FolderGit2 size={16} />
            </GraphDockButton>
          </GraphDockGroup>
          <GraphDockDivider />
          <GraphDockGroup compact position={"last"}>
            <GraphDockButton tooltip={"Undo"} disabled>
              <WorkflowIcon size={16} />
            </GraphDockButton>
            <GraphDockButton tooltip={"Fit"}>
              <NetworkIcon size={16} />
            </GraphDockButton>
          </GraphDockGroup>
        </GraphDock>
      </Row>
      <Row title={"Segmented control"}>
        <GraphSegmented
          value={"peers"}
          items={[
            { value: "peers", label: "Peer", icon: MonitorIcon },
            { value: "users", label: "User", icon: FolderGit2 },
            { value: "groups", label: "Group", icon: FolderGit2 },
            { value: "networks", label: "Networks", icon: NetworkIcon },
          ]}
          ariaLabel={"View"}
        />
        <GraphSegmented
          value={"live"}
          items={[
            {
              value: "live",
              label: (
                <>
                  <GraphDot /> Live
                </>
              ),
            },
            {
              value: "draft",
              label: "Draft",
              trailing: <GraphTag tone={"draft"}>Beta</GraphTag>,
            },
          ]}
          ariaLabel={"Mode"}
        />
      </Row>
      <Row title={"Tags and dots"}>
        <GraphTag>Neutral</GraphTag>
        <GraphTag tone={"draft"}>Draft</GraphTag>
        <GraphTag tone={"warning"}>No network</GraphTag>
        <GraphTag tone={"danger"}>Deleting</GraphTag>
        <GraphDot /> <GraphDot tone={"off"} /> <GraphDot tone={"warning"} />{" "}
        <GraphDot tone={"danger"} />
      </Row>
    </>
  ),
};
