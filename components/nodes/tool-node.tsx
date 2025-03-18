import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

function ToolNode({ data }: NodeProps) {
  return (
    <div className="rounded-md border bg-white shadow-md p-3 w-48">
      <div className="flex items-center justify-between mb-2">
        <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">Tool</div>
      </div>
      <div className="font-bold truncate">{data.name || "Tool"}</div>
      <div className="text-xs text-gray-500 mt-1 truncate">{data.description || "No description"}</div>

      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-green-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
    </div>
  )
}

export default memo(ToolNode)

