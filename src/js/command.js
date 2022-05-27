import { parseQuery, buildUrlQuery } from "./query.js";

// current support commands
// alias and query
function parseCommand(command) {
  // get command type
  const commandType = parseCommandType(command);
  let result;
  switch (commandType) {
    case "query":
      result = parseQuery(command);
      break;
    case "alias":
      result = parseAlias(command);
      break;
    default:
      result = {
        error: "Bad command",
      };
  }

  if (result.error) {
    return {
      commandType: commandType,
      error: result.error,
    };
  } else {
    return {
      commandType: commandType,
      args: result,
    };
  }
}

// extract command type from command
// it could be: query/alias
const commandTypeMap = {
  alias: "alias",
  from: "query",
  where: "query",
};

function parseCommandType(command) {
  const rs = /^(\w+)/.exec(command);
  if (rs && commandTypeMap[rs[1]]) {
    return commandTypeMap[rs[1]];
  }
}

// parse alias command `alias name as n, email as e`
// result is  {aliases: [{source: source_name, as: alias_name}], error: message}
function parseAlias(command) {
  const rs = /^alias\s+(.+)/.exec(command);

  if (rs) {
    const aliases = rs[1]
      .split(",")
      .map((item) => item.trim())
      .map((item) => parseAliasItem(item));

    const error = aliases.find((item) => item.error != null);

    return (
      error || {
        aliases: Object.assign({}, ...aliases),
      }
    );
  } else {
    return { error: "Invalid alias command" };
  }
}

function parseAliasItem(alias) {
  const rs = /^(\w+)\s+as\s+(\w+)$/.exec(alias);
  if (rs) {
    return { [rs[2]]: rs[1] };
  } else {
    return { error: `Invalid alias ${alias}` };
  }
}

const aliasStorageKey = "djquery-aliases";
function execCommand({ commandType, args }) {
  switch (commandType) {
    case "alias":
      const aliases = JSON.parse(localStorage.getItem(aliasStorageKey) || "{}");
      localStorage.setItem(
        aliasStorageKey,
        JSON.stringify(Object.assign(aliases, args.aliases))
      );
      return { message: "Alias saved" };

    case "query":
      const { error, path, query } = buildUrlQuery(args);
      if (error) {
        return { error };
      } else {
        const url = new URL(window.location.href);
        if (path) url.pathname = path;

        if (query) {
          url.search = `?${query}`;
        } else {
          url.search = "";
        }

        window.location.href = url.href;
        return { message: "Query running ..." };
      }
    default:
      return { error: "Bad command" };
  }
}

export { parseCommand, execCommand };
