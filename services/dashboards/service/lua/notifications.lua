

function filterByTagsAndRoles(stream)
  local function streamFilter(rec)
    return true
  end
  local function streamMap(rec)
    local b = map {}
    for k, v in map.pairs(rec) do
      b[k] = v
    end
    return b
  end
  return stream : filter(streamFilter): map(streamMap)
end
