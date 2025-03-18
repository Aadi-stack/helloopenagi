import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

function AgentNode({ data }: NodeProps) {
  return (
    <div className="rounded-md border bg-white shadow-md p-3 w-48">
      <div className="flex items-center justify-between mb-2">
        <div className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded">Agent</div>
      </div>
      <div className="font-bold truncate">{data.name || "Agent"}</div>
      <div className="text-xs text-gray-500 mt-1 truncate">{data.role || "No role defined"}</div>

      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500" />
    </div>
  )
}

export default memo(AgentNode)

