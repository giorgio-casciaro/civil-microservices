

function filterByTagsAndRoles(stream, select, tags, roles)
  local function streamFilter(rec)
    -- if tags==nil then return true end
    -- if rec.tags==nil then return false end
    if tags ~= nil and rec.tags ~= nil then
      for tag in list.iterator(tags) do
        for recTag in list.iterator(rec.tags) do
          if recTag == tag then return true end
        end
      end
    end
    if roles ~= nil and rec.roleId ~= nil then
      for role in list.iterator(roles) do
        if role == rec.roleId then return true end
      end
    end
    return false
  end
  local function streamMap(rec)
    local result = map {}
    -- warn(type(rec.notifications))
    for value in list.iterator(select) do
      result[value] = rec[value]
    end
    return result
  end
  return stream : filter(streamFilter): map(streamMap)
end
