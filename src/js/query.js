// Parse query with syntax
// `from scope where field = value and field2 = value2`
// Using current scope
// `where field = value and field2 = value2`
// Result expect
// {scope: scope, conditions: [{field: field, operator: operator, value: value}]}
function parseQuery(command) {
  const [scope, condition_exp] = parseScope(command);

  const conditions = parseConditions(condition_exp);
  const error = conditions.find((item) => item.error != null);

  return (
    error || {
      scope: scope,
      conditions: conditions,
    }
  );
}

function parseScope(query) {
  // with condition
  const rs1 = /from\s+(?<scope>.+?)\s+(?<conditions>where.+)/.exec(query);
  if (rs1) {
    return [rs1.groups.scope, rs1.groups.conditions];
  }

  // without condition
  const rs = /from\s+(?<scope>.+)/.exec(query);

  if (rs) return [rs.groups.scope, ""];

  return [null, query];
}

function parseConditions(expression) {
  const rs = /where\s+(.+)/.exec(expression);
  if (rs) {
    return rs[1]
      .split(" and ")
      .map((text) => text.trim())
      .map((text) => parseCondition(text));
  } else {
    return { error: "invalid query condition" };
  }
}

function parseCondition(expression) {
  const rs =
    /^(?<field>[a-zA-Z0-9_]+?)\s*(?<operator>=|\<\>|is not null|is null|ilike|like)\s*(?<value>.*)/.exec(
      expression
    );
  if (rs) {
    return rs.groups;
  }

  return {
    error: `Bad expression \"${expression}\"`,
  };
}

// convert scope and conditions to path and query
function buildUrlQuery({ scope, conditions }) {
  let path;
  if (scope) {
    path = `/${mapAlias(scope)}-/`;
  }

  const conditionQuery = conditions.map((condition) =>
    buildConditionQuery(condition)
  );

  const error = conditionQuery.find((item) => item.error != null);

  if (error) {
    return { error: error.error, path: path, query: null };
  } else {
    const query = conditionQuery
      .map((item) => `${item.field}=${item.value}`)
      .join("&");
    return {
      path: path,
      query: query,
    };
  }
}

function mapAlias(scope) {
  const parts = scope.split(".");
  const aliases = JSON.parse(localStorage.getItem("djquery-aliases") || "{}");
  parts[0] = aliases[parts[0]] || parts[0];
  return parts.join("/");
}

// exact
// iexact
// contains
// icontains
// in
// gt
// gte
// lt
// lte
// startswith
// istartswith
// endswith
// iendswith
// range

// date
// year
// iso_year
// month
// day
// week
// week_day
// iso_week_day
// quarter
// time
// hour
// minute
// second

// isnull
// regex
// iregex

function buildConditionQuery(condition) {
  const { field: field, operator: operator, value: value } = condition;
  let op,
    val = value,
    result = [];
  switch (operator.trim()) {
    case "=":
      if (value == "true") val = "True";
      if (value == "false") val = "False";

      result = {
        field: field,
        value: val,
      };
      break;
    case "is null":
      result = {
        field: `${field}__isnull`,
        value: "True",
      };
      break;

    case "is not null":
      result = {
        field: `${field}__isnull`,
        value: "False",
      };
      break;

    case "in":
      result = {
        field: `${field}__in`,
        value: JSON.parse(value.replace("(", "[").replace(")", "]")).join(","),
      };
      break;
    case "like":
      [op, val] = parseTextSearch(operator, value);
      result = {
        field: `${field}__${op}`,
        value: val,
      };
      break;

    case "ilike":
      [op, val] = parseTextSearch(operator, value);
      result = {
        field: `${field}__${op}`,
        value: val,
      };
      break;
    default:
      result = { error: `Operator ${operator} is not supported` };
  }
  return result;
}

// mapping search text expression to djadmin operator
// contains/icontains, startswith/istartswith, endswith/iendswith
// without %, use `exact` oeprator
function parseTextSearch(operator, value) {
  value = value.replace(/'/g, "");
  let rs = /^%(.+)%$/.exec(value);
  let search = null;

  if (rs) {
    search = "contains";
    value = rs[1];
  } else {
    rs = /^%(.+)$/.exec(value);
    if (rs) {
      search = "startswith";
      value = rs[1];
    } else {
      rs = /^(.+)%$/.exec(value);
      if (rs) {
        search = "endswith";
        value = rs[1];
      } else {
        search = "exact";
        value = value;
      }
    }
  }

  if (operator == "ilike") {
    return [`i${search}`, value];
  }
  return [search, value];
}

export { parseQuery, buildUrlQuery };
