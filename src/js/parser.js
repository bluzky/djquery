function parseQuery(query) {
  const [scope, condition_exp] = parseScope(query);

  if (!scope) {
    return {
      error: "No scope specified",
    };
  }

  const conditions = parseConditions(condition_exp);
  const errorCondition = conditions.find((item) => item.error != null);
  if (errorCondition) {
    return {
      error: errorCondition.error,
    };
  }

  return buildUrl(
    scope,
    conditions.map((item) => item.expression)
  );
}

function parseScope(query) {
  // with condition
  const rs1 = /from\s+(?<scope>.+?)\s+where\s+(?<conditions>.+)/.exec(query);
  if (rs1) {
    return [rs1.groups.scope, rs1.groups.conditions];
  }

  // without condition
  const rs = /from\s+(?<scope>.+)/.exec(query);

  if (rs) return [rs.groups.scope, ""];

  return [null, null];
}

function parseConditions(expression) {
  const parts = expression.split(" and ").map((text) => text.trim());
  return parts.map((text) => parseCondition(text));
}

function parseCondition(expression) {
  const rs =
    /^(?<field>[a-zA-Z0-9_]+?) +(?<operator>=|\<\>|is not null|is null|ilike|like)\s*(?<value>.*)/.exec(
      expression
    );
  if (rs) {
    return {
      expression: rs.groups,
      error: null,
    };
  }

  return {
    expression: null,
    error: `Bad expression \"${expression}\"`,
  };
}

function buildUrl(scope, conditions) {
  const path = `/${scope.replace(/\./g, "/")}-/`;
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
  console.log(condition);
  const { field: field, operator: operator, value: value } = condition;
  let result = [];
  switch (operator) {
    case "=":
      result = {
        field: field,
        value: value,
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
      let [op, val] = parseTextSearch(operator, value);
      result = {
        field: `${field}__${op}`,
        value: val,
      };
      break;

    case "ilike":
      let [op1, val1] = parseTextSearch(operator, value);
      result = {
        field: `${field}__${op1}`,
        value: val1,
      };
      break;
    default:
      result = { error: `Operator ${operator} is not supported` };
  }
  return result;
}

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

export { parseQuery };
