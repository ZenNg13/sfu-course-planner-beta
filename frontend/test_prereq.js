// Quick test of prerequisite parser
const prereqString = "(MACM 101 and (CMPT 125, CMPT 129 or CMPT 135)) or (ENSC 251 and ENSC 252)";

class PrerequisiteParser {
  static extractCourses(text) {
    const pattern = /([A-Z]{3,4})\s+(\d{3}[A-Z]?)/g;
    const matches = [];
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const [_, dept, code] = match;
      matches.push(`${dept}-${code}`);
    }
    return matches;
  }

  static parse(text) {
    if (!text || typeof text !== 'string') return null;
    text = text.trim();
    if (!text) return null;

    // Extract all courses
    const courses = this.extractCourses(text);
    if (courses.length === 0) return null;
    if (courses.length === 1) {
      return { type: 'course', value: courses[0], children: null };
    }

    // Remove extra whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return this.parseExpression(text);
  }

  static parseExpression(text) {
    text = text.trim();

    // Remove outer parentheses if they wrap the whole expression
    if (text.startsWith('(') && text.endsWith(')')) {
      let depth = 0;
      let matchesOuter = true;
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '(') depth++;
        if (text[i] === ')') depth--;
        if (depth === 0 && i < text.length - 1) {
          matchesOuter = false;
          break;
        }
      }
      if (matchesOuter) {
        text = text.slice(1, -1).trim();
      }
    }

    // Check for top-level OR
    const orParts = this.splitOnTopLevel(text, ' or ');
    if (orParts.length > 1) {
      return {
        type: 'or',
        value: null,
        children: orParts.map(part => this.parseExpression(part)).filter(Boolean)
      };
    }

    // Check for top-level AND or commas
    const andParts = this.splitOnTopLevel(text, ' and ');
    if (andParts.length > 1) {
      return {
        type: 'and',
        value: null,
        children: andParts.map(part => this.parseExpression(part)).filter(Boolean)
      };
    }

    // Check for commas (implicit AND)
    const commaParts = this.splitOnTopLevel(text, ',');
    if (commaParts.length > 1) {
      return {
        type: 'and',
        value: null,
        children: commaParts.map(part => this.parseExpression(part)).filter(Boolean)
      };
    }

    // Single course
    const courses = this.extractCourses(text);
    if (courses.length === 1) {
      return { type: 'course', value: courses[0], children: null };
    }

    return null;
  }

  static splitOnTopLevel(text, delimiter) {
    const parts = [];
    let current = '';
    let depth = 0;
    let i = 0;

    while (i < text.length) {
      const char = text[i];
      
      if (char === '(') {
        depth++;
        current += char;
        i++;
      } else if (char === ')') {
        depth--;
        current += char;
        i++;
      } else if (depth === 0 && text.substring(i, i + delimiter.length) === delimiter) {
        if (current.trim()) {
          parts.push(current.trim());
        }
        current = '';
        i += delimiter.length;
      } else {
        current += char;
        i++;
      }
    }

    if (current.trim()) {
      parts.push(current.trim());
    }

    return parts.length > 0 ? parts : [text];
  }

  static getStructuredPrereqs(prereqString) {
    const tree = this.parse(prereqString);
    if (!tree) return { andGroups: [], orGroups: [] };

    const andGroups = [];
    const orGroups = [];

    const flattenNode = (node) => {
      if (node.type === 'course' && node.value) {
        andGroups.push([node.value]);
      } else if (node.type === 'and' && node.children) {
        node.children.forEach(child => {
          if (child.type === 'course' && child.value) {
            andGroups.push([child.value]);
          } else if (child.type === 'or' && child.children) {
            const orGroup = child.children
              .filter(c => c.type === 'course' && c.value)
              .map(c => c.value);
            if (orGroup.length > 0) {
              orGroups.push(orGroup);
            }
          } else if (child.type === 'and') {
            flattenNode(child);
          }
        });
      } else if (node.type === 'or' && node.children) {
        const orGroup = node.children
          .filter(c => c.type === 'course' && c.value)
          .map(c => c.value);
        if (orGroup.length > 0) {
          orGroups.push(orGroup);
        }
      }
    };

    flattenNode(tree);
    return { andGroups, orGroups };
  }
}

console.log("Testing prerequisite parser:");
console.log("Input:", prereqString);
console.log("\nExtracted courses:", PrerequisiteParser.extractCourses(prereqString));
console.log("\nParsed tree:", JSON.stringify(PrerequisiteParser.parse(prereqString), null, 2));
console.log("\nStructured:", JSON.stringify(PrerequisiteParser.getStructuredPrereqs(prereqString), null, 2));
