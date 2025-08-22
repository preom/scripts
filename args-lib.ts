export const parseArgs = (args: string[]) => {
  let joined = args.join(" ");

  // == Parse double flags ==
  let withoutDoubleFlag = "";
  const doubleArgs = new Map<string, string>();
  let errors: string[] = [];
  let errorFlags = new Map<string, string>();
  {
    let interim = joined;

    // == Notes ==
    // Allowed `--flag`, `--flag=value`, `--flag="some value"`
    // - n.b. only double quotes are allowed for string values
    // == Quoted ==
    {
      const quotedRegex = /--(\w)+=("(?:[^"\\]|\\.)*")/gm;
      [...interim.matchAll(quotedRegex)].forEach((match) => {
        const flag = match[1];
        const value = match[2];

        if (!flag) {
          errors.push(`Invalid flag: ${match[0]}`);
          errorFlags.set(flag, value);
          return;
        }

        doubleArgs.set(flag, value);
      });
      interim = interim.replace(quotedRegex, "");
    }

    // == Regular ==
    {
      const regex = /--(\w+)(=\w+)?/g;
      [...interim.matchAll(regex)].forEach((match) => {
        const flag = match[1];
        const value = match[2] ? match[2].slice(1) : ""; // remove the leading '=' if present

        if (!flag) {
          errors.push(`Invalid flag: ${match[0]}`);
          errorFlags.set(flag, value);
          return;
        }

        doubleArgs.set(flag, value);
      });
      interim = interim.replace(regex, "");
    }

    // == Other/Malformed ==
    {
      const doubleFlagRegex = /--(\w+)/g;
      [...interim.matchAll(doubleFlagRegex)].forEach((match) => {
        const flag = match[0];
        const flagName = match[1];

        if (!flag || !flagName) {
          errors.push(`Malformed flag: ${flag}`);
          return;
        }

        errors.push(`Malformed flag: ${flag}`);
        errorFlags.set(flagName, "");
      });
      interim = interim.replace(doubleFlagRegex, "");
    }

    // == Update state ==
    withoutDoubleFlag = interim;
  }
  joined = withoutDoubleFlag;

  // == Parse single flags ==
  let withoutSingleFlag = "";
  let singleArgs = new Set<string>();
  {
    // == Setup ==
    const singleFlagRegex = /-([a-zA-Z]+)/g;

    // == Flags ==
    joined.match(singleFlagRegex)?.forEach((match) => {
      const flag = match.slice(1); // remove the leading '-'
      flag.split("").forEach((char) => singleArgs.add(char));
    });

    // == Update state ==
    withoutSingleFlag = joined.replace(singleFlagRegex, "");
  }
  joined = withoutSingleFlag;

  return {
    args: joined.trim().split(/\s+/),
    singleArgs,
    doubleArgs,
    errors,
    errorFlags,
  };
};
