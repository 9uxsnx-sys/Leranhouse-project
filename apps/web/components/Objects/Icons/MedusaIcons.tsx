import * as React from "react"

/**
 * Local port of @medusajs/icons (MIT) — copied from the Medusa monorepo
 * `packages/design-system/icons/src/components/*.tsx`.
 * clipPath/defs wrappers are stripped (ids would collide across icons);
 * rendered paths are byte-identical to the originals.
 */

export interface MedusaIconProps extends React.SVGAttributes<SVGSVGElement> {
  color?: string
}

const base = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 15,
  height: 15,
  viewBox: "0 0 15 15",
  fill: "none",
} as const

export const BarsThree = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M1.5 7.5h12M1.5 2.833h12M1.5 12.167h12"
      />
    </svg>
  )
)
BarsThree.displayName = "BarsThree"

export const Check = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="m3.036 7.679 2.857 3.571 6.071-7.5"
      />
    </svg>
  )
)
Check.displayName = "Check"

export const ChevronDownMini = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.056 5.278 7.5 10.833 1.944 5.278"
      />
    </svg>
  )
)
ChevronDownMini.displayName = "ChevronDownMini"

export const TrianglesMini = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        fill={color}
        d="M4.91 5.75c-.163 0-.323-.037-.464-.108a.85.85 0 0 1-.334-.293A.7.7 0 0 1 4 4.952a.7.7 0 0 1 .142-.39l2.59-3.454c.082-.11.195-.2.33-.263a1.04 1.04 0 0 1 .876 0 .9.9 0 0 1 .33.263l2.59 3.455a.7.7 0 0 1 .141.39.7.7 0 0 1-.111.396.85.85 0 0 1-.335.293c-.14.07-.3.108-.464.108zM10.09 9.25c.163 0 .323.037.463.108.14.07.256.172.335.293a.7.7 0 0 1 .111.397.7.7 0 0 1-.141.39l-2.59 3.454a.9.9 0 0 1-.33.263 1.04 1.04 0 0 1-.876 0 .9.9 0 0 1-.33-.263l-2.59-3.455a.7.7 0 0 1-.142-.39.7.7 0 0 1 .112-.396.85.85 0 0 1 .335-.293c.14-.07.3-.108.463-.108z"
      />
    </svg>
  )
)
TrianglesMini.displayName = "TrianglesMini"

export const XMark = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="m11.25 3.75-7.5 7.5M3.75 3.75l7.5 7.5"
      />
    </svg>
  )
)
XMark.displayName = "XMark"

export const Spinner = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <g stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
        <path d="M3.11 2.943 4.68 4.514" />
        <path d="M1.222 7.5h2.222" opacity={0.88} />
        <path d="m3.11 12.057 1.571-1.571" opacity={0.75} />
        <path d="M7.667 13.945v-2.222" opacity={0.63} />
        <path d="m12.224 12.057-1.572-1.571" opacity={0.5} />
        <path d="M14.112 7.5h-2.223" opacity={0.38} />
        <path d="m12.224 2.943-1.572 1.571" opacity={0.25} />
        <path d="M7.667 1.055v2.223" opacity={0.13} />
      </g>
    </svg>
  )
)
Spinner.displayName = "Spinner"

export const ChatBubble = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        fill={color}
        fillRule="evenodd"
        d="M2.833.75A2.53 2.53 0 0 0 .306 3.278V9.5a2.53 2.53 0 0 0 2.527 2.528h1.028v1.916a.75.75 0 0 0 1.219.586l3.128-2.502h3.959A2.53 2.53 0 0 0 14.695 9.5V3.278A2.53 2.53 0 0 0 12.167.75zM1.806 3.278c0-.568.46-1.028 1.027-1.028h9.334c.568 0 1.028.46 1.028 1.028V9.5c0 .567-.46 1.028-1.028 1.028H7.945a.75.75 0 0 0-.469.164l-2.115 1.692v-1.106a.75.75 0 0 0-.75-.75H2.833c-.567 0-1.027-.46-1.027-1.028zm4.805 3.11a.89.89 0 0 0 1.778 0 .89.89 0 0 0-1.778 0m-2.222.89a.89.89 0 0 1 0-1.778.89.89 0 0 1 0 1.778m5.333-.89a.89.89 0 0 0 1.778 0 .89.89 0 0 0-1.778 0"
        clipRule="evenodd"
      />
    </svg>
  )
)
ChatBubble.displayName = "ChatBubble"

export const QuestionMark = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <g fill={color}>
        <path d="M7.594 4.807c-.538 0-1.018.247-1.234.835a.75.75 0 0 1-1.408-.517c.474-1.291 1.604-1.818 2.641-1.818 1.128 0 2.367.825 2.367 2.357 0 .538-.142.972-.395 1.33-.237.333-.543.554-.763.708l-.016.012c-.464.326-.639.449-.7.804a.75.75 0 1 1-1.478-.259c.172-.985.835-1.441 1.243-1.722l.09-.062c.214-.151.327-.246.4-.35.058-.08.119-.205.119-.46 0-.549-.403-.858-.867-.858M6.425 10.67a.89.89 0 0 0 1.778 0 .89.89 0 0 0-1.778 0" />
        <path
          fillRule="evenodd"
          d="M.306 7.5a7.194 7.194 0 1 1 14.389 0 7.194 7.194 0 0 1-14.39 0M7.5 1.805a5.694 5.694 0 1 0 0 11.39 5.694 5.694 0 0 0 0-11.39"
          clipRule="evenodd"
        />
      </g>
    </svg>
  )
)
QuestionMark.displayName = "QuestionMark"

export const Directions = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7.5 1.056v12.889M4.611 13.944h5.778M7.5 5.056H2.952a.9.9 0 0 1-.594-.229L1.123 3.716a.89.89 0 0 1 0-1.322l1.235-1.11a.9.9 0 0 1 .594-.23H7.5M9.718 9.056h2.325c.22 0 .431-.081.595-.229l1.234-1.111a.89.89 0 0 0 0-1.322l-1.234-1.11a.9.9 0 0 0-.595-.23H9.718"
      />
    </svg>
  )
)
Directions.displayName = "Directions"

export const GridLayout = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12.167 1.944H2.833a.89.89 0 0 0-.889.89v1.333c0 .49.398.888.89.888h9.333c.49 0 .889-.398.889-.888V2.833a.89.89 0 0 0-.89-.889M5.5 7.722H2.833a.89.89 0 0 0-.889.89v3.555c0 .49.398.889.89.889H5.5c.49 0 .889-.398.889-.89V8.612a.89.89 0 0 0-.889-.889M9.056 7.722h4M9.056 10.39h4M9.056 13.056h4"
      />
    </svg>
  )
)
GridLayout.displayName = "GridLayout"

export const GridList = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8.611 2.834h4.445M8.611 5.5h4.445M8.611 9.5h4.445M8.611 12.167h4.445M5.056 1.944H2.833a.89.89 0 0 0-.889.89v2.221c0 .491.398.89.89.89h2.222c.49 0 .888-.399.888-.89V2.833a.89.89 0 0 0-.888-.889M5.056 9.056H2.833a.89.89 0 0 0-.889.889v2.222c0 .49.398.889.89.889h2.222c.49 0 .888-.398.888-.89V9.946a.89.89 0 0 0-.888-.89"
      />
    </svg>
  )
)
GridList.displayName = "GridList"

export const Book = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.611 1.056v9.777M1.944 12.389V2.833c0-.982.796-1.777 1.778-1.777h9.334v9.777"
      />
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.167 13.945H3.5a1.556 1.556 0 1 1 0-3.111h9.556c-.57.75-.653 2.264 0 3.11zM7.278 4.167h3.11M7.278 6.834h3.11"
      />
    </svg>
  )
)
Book.displayName = "Book"

export const GlobeEurope = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <g stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
        <path d="M4.63 8.288C4.59 8.231 3.87 7.112 4.416 6c.06-.122.43-.844 1.195-1.056 1.132-.314 1.958.816 2.493.475.599-.381-.24-1.916.451-2.781.526-.659 1.685-.61 2.563-.472M4.63 8.288c1.412-.39 2.32-.199 2.926.156.835.489.894 1.171 1.61 1.306 1.034.193 1.64-1.091 2.556-.917.426.081.944.482 1.394 1.829" />
        <path d="M7.145 13.927c.132-.515.208-1.194-.145-1.723-.376-.565-.907-.46-1.264-1.05-.371-.618.013-1.054-.264-1.82-.26-.72-.854-1.044-1.3-1.37-.743-.543-1.666-1.521-2.39-3.43" />
        <path d="M7.5 13.945a6.444 6.444 0 1 0 0-12.89 6.444 6.444 0 0 0 0 12.89" />
      </g>
    </svg>
  )
)
GlobeEurope.displayName = "GlobeEurope"

export const Language = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M1.5 3.278h7.111M5.056 1.5v1.778M3.278 3.278a5.43 5.43 0 0 0 3.577 4.919"
      />
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M6.833 3.278C6.478 8.278 1.5 8.61 1.5 8.61M7.722 13.5l2.667-7.111h.444l2.667 7.11M8.556 11.278h4.111"
      />
    </svg>
  )
)
Language.displayName = "Language"

export const ArrowRightOnRectangle = React.forwardRef<
  SVGSVGElement,
  MedusaIconProps
>(({ color = "currentColor", ...props }, ref) => (
  <svg {...base} ref={ref} {...props}>
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8.167 1.944h3.11c.983 0 1.779.796 1.779 1.778v7.556c0 .982-.796 1.778-1.778 1.778H8.167"
    />
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M5.5 10.611 8.611 7.5 5.5 4.389M8.611 7.5H1.944"
    />
  </svg>
))
ArrowRightOnRectangle.displayName = "ArrowRightOnRectangle"

export const MagnifyingGlassMini = React.forwardRef<
  SVGSVGElement,
  MedusaIconProps
>(({ color = "currentColor", ...props }, ref) => (
  <svg {...base} ref={ref} {...props}>
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M13.056 13.056 9.53 9.53M6.389 10.833a4.444 4.444 0 1 0 0-8.888 4.444 4.444 0 0 0 0 8.888"
    />
  </svg>
))
MagnifyingGlassMini.displayName = "MagnifyingGlassMini"

export const IdBadge = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        fill={color}
        d="M5.072 8.011a1.128 1.128 0 1 0 0-2.256 1.128 1.128 0 0 0 0 2.256M6.886 10.587a.576.576 0 0 0 .36-.779 2.377 2.377 0 0 0-4.347 0 .576.576 0 0 0 .36.779 6.014 6.014 0 0 0 3.627 0"
      />
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11.055 3.533h1.111c.983 0 1.778.796 1.778 1.778v5.778c0 .982-.795 1.777-1.778 1.777H2.833a1.777 1.777 0 0 1-1.778-1.777V5.31c0-.982.796-1.778 1.778-1.778h1.111"
      />
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7.5.867c.613 0 1.11.497 1.11 1.11v2H6.39v-2c0-.613.497-1.11 1.11-1.11M8.833 7.089h2.445M8.833 9.755h2.445"
      />
    </svg>
  )
)
IdBadge.displayName = "IdBadge"

export const CreditCard = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <g stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
        <path d="M1.056 5.944h12.888M2.833 12.167h9.334c.982 0 1.777-.796 1.777-1.778V4.61c0-.982-.796-1.778-1.777-1.778H2.833c-.981 0-1.777.796-1.777 1.778v5.778c0 .982.796 1.778 1.777 1.778M3.278 9.5h2.666M10.833 9.5h.89" />
      </g>
    </svg>
  )
)
CreditCard.displayName = "CreditCard"

export const FolderOpen = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <g stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
        <path d="M4.167 12.292h-.625c-.921 0-1.667-.746-1.667-1.667V3.958c0-.92.746-1.666 1.667-1.666h1.52c.49 0 .954.215 1.27.587l1.27 1.496h3.855c.921 0 1.667.746 1.667 1.667v.833" />
        <path d="m13.457 11.058.702-2.608a1.25 1.25 0 0 0-1.207-1.575H5.126c-.565 0-1.06.38-1.207.925l-.785 2.917a1.25 1.25 0 0 0 1.207 1.575h7.508c.753 0 1.413-.506 1.609-1.234" />
      </g>
    </svg>
  )
)
FolderOpen.displayName = "FolderOpen"

export const Folder = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        fill={color}
        d="M.75 10.833V3.722a2.527 2.527 0 0 1 2.527-2.528H4.9c.696 0 1.358.287 1.833.789l.093.102 1.131 1.332h3.766a2.527 2.527 0 0 1 2.527 2.527v4.89a2.53 2.53 0 0 1-2.527 2.528H3.277A2.53 2.53 0 0 1 .75 10.833"
      />
    </svg>
  )
)
Folder.displayName = "Folder"

export const CommandLine = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11.278 1.944H3.722c-.982 0-1.778.796-1.778 1.778v7.556c0 .981.796 1.777 1.778 1.777h7.556c.982 0 1.778-.796 1.778-1.777V3.722c0-.982-.796-1.778-1.778-1.778M8.167 10.389h2.222"
      />
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="m4.611 10.389 2.222-2.222-2.222-2.223"
      />
    </svg>
  )
)
CommandLine.displayName = "CommandLine"

export const CubeSolid = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        fill={color}
        d="M13.4 4.095s-.001-.01-.004-.015q-.006-.006-.012-.013c-.21-.359-.509-.666-.879-.88L8.727.996a2.45 2.45 0 0 0-2.454 0L2.496 3.187a2.44 2.44 0 0 0-.88.88q-.005.006-.012.013-.003.008-.004.015a2.44 2.44 0 0 0-.322 1.207v4.396c0 .869.466 1.678 1.218 2.115l3.777 2.191c.376.217.795.325 1.215.327l.012.003q.006-.001.013-.003c.42-.002.84-.11 1.214-.327l3.778-2.191a2.45 2.45 0 0 0 1.217-2.114V5.302c0-.43-.115-.845-.322-1.207M3.165 10.66a1.12 1.12 0 0 1-.554-.962V5.435l4.222 2.449v4.902zm8.67 0-3.668 2.128V7.885l4.222-2.449v4.263c0 .395-.212.763-.554.961"
      />
    </svg>
  )
)
CubeSolid.displayName = "CubeSolid"

export const EllipsisHorizontal = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        fill={color}
        fillRule="evenodd"
        d="M6.306 7.5a1.194 1.194 0 1 1 2.389 0 1.194 1.194 0 0 1-2.39 0M1.194 7.5a1.194 1.194 0 1 1 2.39 0 1.194 1.194 0 0 1-2.39 0M11.417 7.5a1.194 1.194 0 1 1 2.389 0 1.194 1.194 0 0 1-2.39 0"
        clipRule="evenodd"
      />
    </svg>
  )
)
EllipsisHorizontal.displayName = "EllipsisHorizontal"

export const Trash = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M1.944 3.278h11.112M5.5 3.278V1.944a.89.89 0 0 1 .889-.888H8.61a.89.89 0 0 1 .889.888v1.334M11.722 5.5v6.667c0 .982-.795 1.777-1.777 1.777h-4.89a1.777 1.777 0 0 1-1.777-1.777V5.5M5.944 7.278v4M9.056 7.278v4"
      />
    </svg>
  )
)
Trash.displayName = "Trash"

export const SquareTwoStack = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <g stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
        <path d="M12.386 4.5H7.614c-.753 0-1.364.773-1.364 1.727v6.046c0 .954.61 1.727 1.364 1.727h4.772c.754 0 1.364-.773 1.364-1.727V6.227c0-.954-.61-1.727-1.364-1.727" />
        <path d="M8.633 2.025C8.42 1.421 7.943 1 7.386 1H2.614C1.86 1 1.25 1.773 1.25 2.727v6.046c0 .954.61 1.727 1.364 1.727h1.039" />
      </g>
    </svg>
  )
)
SquareTwoStack.displayName = "SquareTwoStack"

export const ArrowDownTray = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.056 9.944v1.334c0 .982-.796 1.778-1.778 1.778H3.722a1.777 1.777 0 0 1-1.778-1.778V9.944M4.389 5.5 7.5 8.611 10.611 5.5M7.5 8.611V1.944"
      />
    </svg>
  )
)
ArrowDownTray.displayName = "ArrowDownTray"

export const PencilSquare = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <g stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
        <path d="M2.833 13.056s3.2-.505 4.041-1.347l6.513-6.513a1.904 1.904 0 1 0-2.693-2.693L4.18 9.016c-.842.841-1.347 4.04-1.347 4.04zM6.833 1.944H1.056M3.278 5.056H1.056" />
      </g>
    </svg>
  )
)
PencilSquare.displayName = "PencilSquare"

export const CogSixTooth = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <g stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
        <path d="M7.5 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
        <path d="m12.989 5.97-.826-.292a5 5 0 0 0-.323-.685 5 5 0 0 0-.43-.621l.16-.86a1.43 1.43 0 0 0-.692-1.503l-.312-.18a1.43 1.43 0 0 0-1.647.152l-.663.566a5 5 0 0 0-1.513 0L6.08 1.98a1.43 1.43 0 0 0-1.647-.152l-.312.18a1.43 1.43 0 0 0-.691 1.503l.16.857c-.32.4-.574.841-.758 1.31l-.82.29a1.43 1.43 0 0 0-.956 1.35v.36c0 .608.383 1.15.955 1.35l.826.292c.09.232.194.462.323.684.128.222.275.427.43.622l-.16.86c-.111.597.166 1.2.691 1.503l.312.18a1.43 1.43 0 0 0 1.647-.152l.663-.567a5 5 0 0 0 1.512 0l.663.568a1.43 1.43 0 0 0 1.647.152l.312-.18c.526-.304.803-.906.691-1.502l-.16-.86c.32-.398.575-.84.757-1.308l.822-.29c.572-.202.956-.743.956-1.35v-.36c0-.608-.383-1.149-.956-1.35z" />
      </g>
    </svg>
  )
)
CogSixTooth.displayName = "CogSixTooth"

export const PlusMini = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7.5 2.5v10M2.5 7.5h10"
      />
    </svg>
  )
)
PlusMini.displayName = "PlusMini"

export const ArrowRightMini = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.056 7.5H1.944M9.278 3.722 13.056 7.5l-3.778 3.778"
      />
    </svg>
  )
)
ArrowRightMini.displayName = "ArrowRightMini"

export const ExclamationCircle = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <g stroke={color}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7.5 13.944a6.444 6.444 0 1 0 0-12.888 6.444 6.444 0 0 0 0 12.888M7.5 4.328v3.678"
        />
        <path
          strokeWidth={0.9}
          d="M7.5 10.099a.44.44 0 0 1 .44.438.44.44 0 0 1-.44.44.44.44 0 0 1 0-.878Z"
        />
      </g>
    </svg>
  )
)
ExclamationCircle.displayName = "ExclamationCircle"

export const House = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12.705 5.011 8.038 1.465a.89.89 0 0 0-1.076 0L2.296 5.01a.89.89 0 0 0-.352.709v6.448c0 .982.796 1.777 1.778 1.777h2.222V10.39a.89.89 0 0 1 .89-.889h1.333a.89.89 0 0 1 .889.889v3.555h2.222c.982 0 1.778-.795 1.778-1.777v-6.45a.89.89 0 0 0-.351-.707"
      />
    </svg>
  )
)
House.displayName = "House"

export const Users = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <g
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      >
        <path d="M4.701 6.854a1.722 1.722 0 1 0 0-3.444 1.722 1.722 0 0 0 0 3.444M8.024 12.772c.45-.151.715-.64.548-1.084a4.135 4.135 0 0 0-7.74 0c-.167.444.098.934.548 1.084a10.486 10.486 0 0 0 6.644 0M10.083 4.701a1.722 1.722 0 1 0 0-3.444 1.722 1.722 0 0 0 0 3.444M10.728 11.14a10.5 10.5 0 0 0 2.678-.521c.45-.15.714-.64.547-1.084a4.135 4.135 0 0 0-6.146-1.997" />
      </g>
    </svg>
  )
)
Users.displayName = "Users"

export const ShoppingCart = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        fill={color}
        fillRule="evenodd"
        d="M1.631.37a.75.75 0 0 0-.364 1.455l1.201.3a.14.14 0 0 1 .104.115l.238 1.615.005.038.663 4.501a1.862 1.862 0 0 0 .416 3.675h9.555a.75.75 0 0 0 0-1.5H3.894a.362.362 0 0 1 0-.722h.403a1 1 0 0 0 .083 0h7.095c.704 0 1.332-.45 1.556-1.121l1.184-3.555a1.64 1.64 0 0 0-1.555-2.157H4.202l-.146-.992A1.64 1.64 0 0 0 2.832.67zm2.792 4.144.564 3.833h6.488c.06 0 .114-.038.132-.094l1.185-3.556a.138.138 0 0 0-.132-.183zM3.227 14.653a1.111 1.111 0 1 0 0-2.222 1.111 1.111 0 0 0 0 2.222m10.445-1.111a1.111 1.111 0 1 1-2.223 0 1.111 1.111 0 0 1 2.223 0"
        clipRule="evenodd"
      />
    </svg>
  )
)
ShoppingCart.displayName = "ShoppingCart"

export const TriangleRightMini = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        fill={color}
        d="M5 4.91c0-.163.037-.323.108-.464a.85.85 0 0 1 .293-.334A.7.7 0 0 1 5.798 4a.7.7 0 0 1 .39.142l3.454 2.59c.11.082.2.195.263.33a1.04 1.04 0 0 1 0 .876.9.9 0 0 1-.263.33l-3.455 2.59a.7.7 0 0 1-.39.141.7.7 0 0 1-.396-.111.85.85 0 0 1-.293-.335c-.07-.14-.108-.3-.108-.464z"
      />
    </svg>
  )
)
TriangleRightMini.displayName = "TriangleRightMini"

export const MagnifyingGlass = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.056 13.056 9.53 9.53M6.389 10.833a4.444 4.444 0 1 0 0-8.888 4.444 4.444 0 0 0 0 8.888"
      />
    </svg>
  )
)
MagnifyingGlass.displayName = "MagnifyingGlass"

export const PlaySolid = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        fill={color}
        d="M12.922 6.147 4.485 1.475a1.55 1.55 0 0 0-1.555.02c-.478.282-.763.78-.763 1.333v9.344c0 .553.285 1.05.763 1.332.248.146.521.22.796.22.26 0 .52-.067.759-.198l8.436-4.672c.495-.273.801-.792.801-1.353s-.306-1.081-.8-1.354"
      />
    </svg>
  )
)
PlaySolid.displayName = "PlaySolid"

export const SidebarLeft = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <g stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
        <path d="M12.167 1.75H2.833c-.982 0-1.777.824-1.777 1.84v7.82c0 1.016.795 1.84 1.777 1.84h9.334c.982 0 1.777-.824 1.777-1.84V3.59c0-1.016-.796-1.84-1.777-1.84M3.9 4.5v6" />
      </g>
    </svg>
  )
)
SidebarLeft.displayName = "SidebarLeft"

export const BellAlert = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <path
        fill={color}
        fillRule="evenodd"
        d="M7.5.347A4.973 4.973 0 0 0 2.528 5.32v4.222c0 .568-.46 1.027-1.028 1.027a.75.75 0 0 0 0 1.5h12a.75.75 0 0 0 0-1.5c-.568 0-1.028-.46-1.028-1.027V5.32A4.973 4.973 0 0 0 7.5.347m3.472 9.195c0 .366.078.713.218 1.027H3.81a2.5 2.5 0 0 0 .218-1.027V5.32a3.473 3.473 0 0 1 6.944 0zm-2.405 3.333a.444.444 0 0 1 .435.536c-.154.73-.771 1.242-1.501 1.242S6.153 14.142 6 13.41a.445.445 0 0 1 .434-.536z"
        clipRule="evenodd"
      />
    </svg>
  )
)
BellAlert.displayName = "BellAlert"

export const BellAlertDone = React.forwardRef<SVGSVGElement, MedusaIconProps>(
  ({ color = "currentColor", ...props }, ref) => (
    <svg {...base} ref={ref} {...props}>
      <circle cx={12.5} cy={2.5} r={2.5} fill="#2563EB" />
      <circle
        cx={12.5}
        cy={2.5}
        r={2.25}
        stroke={color}
        strokeOpacity={0.24}
        strokeWidth={0.5}
      />
      <path
        fill={color}
        d="M8.993.575A4.973 4.973 0 0 0 2.528 5.32v4.223c0 .568-.46 1.028-1.028 1.028a.75.75 0 0 0 0 1.5h12a.75.75 0 0 0 0-1.5c-.568 0-1.028-.46-1.028-1.028V6.5a4 4 0 0 1-1.5-.302v3.344c0 .366.078.714.218 1.028H3.81a2.5 2.5 0 0 0 .218-1.028V5.32A3.473 3.473 0 0 1 8.53 2.003c.063-.512.223-.994.462-1.428M8.912 13.04a.44.44 0 0 0-.345-.165H6.434a.444.444 0 0 0-.434.536c.153.73.771 1.242 1.5 1.242.73 0 1.348-.511 1.502-1.242a.45.45 0 0 0-.09-.372"
      />
    </svg>
  )
)
BellAlertDone.displayName = "BellAlertDone"
