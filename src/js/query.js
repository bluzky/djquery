// Parse query with syntax
// `from scope where field = value and field2 = value2`
// Using current scope
// `where field = value and field2 = value2`
// Result expect
// {scope: scope, conditions: [{field: field, operator: operator, value: value}]}
function parseQuery(command) {
  const [scope, condition_exp] = parseScope(command.trim());

  const conditions = parseConditions(condition_exp);
  if (conditions.error) {
    return conditions;
  } else {
    return {
      scope: scope,
      conditions: conditions,
    };
  }
}

function parseScope(query) {
  // with condition
  const rs1 = /from\s+(?<scope>.+?)\s+(?<conditions>.+)/.exec(query);
  if (rs1) {
    return [rs1.groups.scope, rs1.groups.conditions];
  }

  // without condition
  const rs = /from\s+(?<scope>.+)/.exec(query);

  if (rs) return [rs.groups.scope, ""];

  return [null, query];
}

function parseConditions(expression) {
  const text = expression.replace(/where\s*/, "").trim();
  // empty conditions
  if (text == "") return [];

  // with where conditions

  return text
    .split(" and ")
    .map((text) => text.trim())
    .map((text) => parseCondition(text));
}

function parseCondition(expression) {
  const rs =
    /^(?<field>[a-zA-Z0-9_\.]+?)\s*(?<operator>=|\>|\>=|\<|\<=|is not null|is null|ilike|like|in)\s*(?<value>.*)/.exec(
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
    path = `/${mapAlias(scope)}-/`.replace(/_/g, "");
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
const operatorMap = {
  "=": "exact",
  ">": "gt",
  ">=": "gte",
  "<": "lt",
  "<=": "lte",
};
function buildConditionQuery(condition) {
  let { field: field, operator: operator, value: value } = condition;
  field = field.replace(/\./g, "__");
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
      op = operatorMap[operator];
      if (op) {
        result = { field: `${field}__${op}`, value: value };
      } else {
        result = { error: `Operator ${operator} is not supported` };
      }
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

function urlToQuery(url) {
  const conditions = urlToConditions(url);

  let query;
  if (conditions.length > 0) {
    query = `${conditions.join(" and ")}`;
  }
  return query;
}

function urlToConditions(url) {
  return url.search
    .replace("?", "")
    .split("&")
    .map((part) => decodeCondition(part))
    .filter((item) => item != null);
}

function decodeCondition(text) {
  if (text == "") return null;
  const [field, value] = text.split("=");
  const parts = field.split("__");
  let operator,
    fieldName,
    val = value;

  if (parts.length == 1) {
    operator = "exact";
    fieldName = parts[0];
  } else {
    operator = parts.pop();
    fieldName = parts.join(".");
  }

  switch (operator) {
    case "exact":
      if (value == "True") val = "true";
      if (value == "False") val = "false";

      operator = "=";
      break;

    case "isnull":
      val = "";
      if (value == "True") {
        operator = "is null";
      } else {
        operator = "is not null";
      }
      break;

    case "in":
      operator = "in";
      val = `(${value})`;
      break;

    case "startswith":
      operator = "like";
      val = `%${value}`;
      break;

    case "istartswith":
      operator = "ilike";
      val = `%${value}`;
      break;

    case "endswith":
      operator = "like";
      val = `${value}%`;
      break;

    case "iendswith":
      operator = "ilike";
      val = `${value}%`;
      break;

    case "contains":
      operator = "like";
      val = `%${value}%`;
      break;

    case "icontains":
      operator = "ilike";
      val = `%${value}%`;
      break;

    default:
      operator = Object.keys(operatorMap).find(
        (key) => operatorMap[key] == operator
      );
      if (!operator) {
        operator = "=";
      }
  }
  return `${fieldName} ${operator} ${val}`.trim();
}

export { parseQuery, buildUrlQuery, urlToQuery };
