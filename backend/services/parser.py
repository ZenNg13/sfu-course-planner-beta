"""
Prerequisite Logic Parser.
Converts prerequisite strings into structured boolean trees.
"""
import re
import logging
from typing import Optional, Any

logger = logging.getLogger(__name__)


class PrerequisiteParser:
    """
    Parses SFU prerequisite strings into structured logic trees.
    
    Examples:
        "CMPT 120 or 125" -> {"type": "OR", "courses": ["CMPT-120", "CMPT-125"]}
        "CMPT 120 and 125" -> {"type": "AND", "courses": ["CMPT-120", "CMPT-125"]}
        "CMPT 120 and (MATH 150 or 151)" -> nested structure
    """
    
    def __init__(self):
        # Regex patterns
        self.course_pattern = re.compile(r'\b([A-Z]{3,4})\s*(\d{3}[A-Z]?)\b')
        self.number_only_pattern = re.compile(r'\b(\d{3}[A-Z]?)\b')
        
    def parse(self, prereq_string: str) -> Optional[dict[str, Any]]:
        """
        Parse a prerequisite string into a logic tree.
        
        Args:
            prereq_string: Raw prerequisite string
            
        Returns:
            Dictionary representing the logic tree, or None if parsing fails
        """
        if not prereq_string or prereq_string.strip() == "":
            return None
        
        try:
            # Clean the string
            prereq_string = self._clean_string(prereq_string)
            
            # If empty after cleaning, return None
            if not prereq_string:
                return None
            
            # Parse the expression
            tree = self._parse_expression(prereq_string)
            
            return tree
            
        except Exception as e:
            logger.error(f"Error parsing prerequisite '{prereq_string}': {e}")
            return None
    
    def _clean_string(self, s: str) -> str:
        """Clean and normalize the prerequisite string."""
        # Remove common prefixes
        s = re.sub(r'^(Prerequisite|Corequisite|Pre-?req)s?:?\s*', '', s, flags=re.IGNORECASE)
        
        # Normalize whitespace
        s = ' '.join(s.split())
        
        # Normalize AND/OR operators
        s = re.sub(r'\b(AND)\b', 'and', s, flags=re.IGNORECASE)
        s = re.sub(r'\b(OR)\b', 'or', s, flags=re.IGNORECASE)
        
        return s
    
    def _parse_expression(self, expr: str, last_dept: Optional[str] = None) -> dict[str, Any]:
        """
        Recursively parse an expression into a tree structure.
        
        This uses a simple recursive descent parser to handle AND/OR precedence
        and parentheses.
        """
        expr = expr.strip()
        
        # Handle parentheses
        if '(' in expr:
            return self._parse_with_parentheses(expr, last_dept)
        
        # Split by OR (lower precedence)
        if ' or ' in expr.lower():
            parts = self._split_by_operator(expr, 'or')
            if len(parts) > 1:
                children = []
                for part in parts:
                    parsed = self._parse_expression(part.strip(), last_dept)
                    if parsed:
                        children.append(parsed)
                
                if len(children) == 1:
                    return children[0]
                elif len(children) > 1:
                    return {"type": "OR", "children": children}
        
        # Split by AND (higher precedence)
        if ' and ' in expr.lower():
            parts = self._split_by_operator(expr, 'and')
            if len(parts) > 1:
                children = []
                for part in parts:
                    parsed = self._parse_expression(part.strip(), last_dept)
                    if parsed:
                        children.append(parsed)
                
                if len(children) == 1:
                    return children[0]
                elif len(children) > 1:
                    return {"type": "AND", "children": children}
        
        # Base case: single course or list of courses
        courses = self._extract_courses(expr, last_dept)
        
        if len(courses) == 1:
            return {"type": "COURSE", "course": courses[0]}
        elif len(courses) > 1:
            # Multiple courses without explicit AND/OR - assume OR
            return {
                "type": "OR",
                "children": [{"type": "COURSE", "course": c} for c in courses]
            }
        else:
            # No courses found - might be a complex expression
            return {"type": "UNKNOWN", "expression": expr}
    
    def _parse_with_parentheses(self, expr: str, last_dept: Optional[str] = None) -> dict[str, Any]:
        """Parse expressions with parentheses."""
        # Find matching parentheses and recursively parse
        result_parts = []
        current = ""
        paren_depth = 0
        i = 0
        
        while i < len(expr):
            char = expr[i]
            
            if char == '(':
                if paren_depth == 0 and current.strip():
                    result_parts.append(('text', current.strip()))
                    current = ""
                paren_depth += 1
                if paren_depth > 1:
                    current += char
            elif char == ')':
                paren_depth -= 1
                if paren_depth == 0:
                    # Parse the content inside parentheses
                    result_parts.append(('paren', current.strip()))
                    current = ""
                else:
                    current += char
            else:
                current += char
            
            i += 1
        
        if current.strip():
            result_parts.append(('text', current.strip()))
        
        # Now we have parts - rebuild the expression with parsed parentheses
        if not result_parts:
            return {"type": "UNKNOWN", "expression": expr}
        
        # For simplicity, if we have parentheses, treat them as groups in OR/AND
        parsed_parts = []
        for part_type, part_content in result_parts:
            if part_type == 'paren':
                parsed = self._parse_expression(part_content, last_dept)
                parsed_parts.append(parsed)
            else:
                parsed = self._parse_expression(part_content, last_dept)
                parsed_parts.append(parsed)
        
        if len(parsed_parts) == 1:
            return parsed_parts[0]
        
        # Determine operator between parts
        if ' or ' in expr.lower():
            return {"type": "OR", "children": parsed_parts}
        else:
            return {"type": "AND", "children": parsed_parts}
    
    def _split_by_operator(self, expr: str, operator: str) -> list[str]:
        """Split expression by operator, respecting parentheses."""
        parts = []
        current = ""
        paren_depth = 0
        
        # Create pattern for the operator
        pattern = f' {operator} '
        i = 0
        
        while i < len(expr):
            # Check for operator at current position (case-insensitive)
            if paren_depth == 0 and i + len(pattern) <= len(expr):
                substr = expr[i:i+len(pattern)]
                if substr.lower() == pattern:
                    parts.append(current.strip())
                    current = ""
                    i += len(pattern)
                    continue
            
            char = expr[i]
            if char == '(':
                paren_depth += 1
            elif char == ')':
                paren_depth -= 1
            
            current += char
            i += 1
        
        if current.strip():
            parts.append(current.strip())
        
        return [p for p in parts if p]
    
    def _extract_courses(self, text: str, last_dept: Optional[str] = None) -> list[str]:
        """
        Extract course codes from text.
        
        Handles cases like:
            "CMPT 120" -> ["CMPT-120"]
            "CMPT 120 or 125" -> ["CMPT-120", "CMPT-125"] (with context)
            "120" -> ["CMPT-120"] (if last_dept is "CMPT")
        """
        courses = []
        
        # Find full course codes (DEPT NUMBER)
        matches = self.course_pattern.findall(text)
        for dept, number in matches:
            courses.append(f"{dept}-{number}")
            last_dept = dept
        
        # Find standalone numbers (inherit department from context)
        if last_dept:
            # Remove already matched full courses to avoid duplicates
            remaining_text = text
            for dept, number in matches:
                remaining_text = remaining_text.replace(f"{dept} {number}", "", 1)
                remaining_text = remaining_text.replace(f"{dept}{number}", "", 1)
            
            # Find remaining numbers
            number_matches = self.number_only_pattern.findall(remaining_text)
            for number in number_matches:
                course_code = f"{last_dept}-{number}"
                if course_code not in courses:
                    courses.append(course_code)
        
        return courses
    
    def flatten_courses(self, tree: Optional[dict[str, Any]]) -> list[str]:
        """
        Flatten a prerequisite tree into a simple list of all mentioned courses.
        
        Args:
            tree: The prerequisite tree structure
            
        Returns:
            List of course codes
        """
        if not tree:
            return []
        
        courses = []
        
        def traverse(node: dict[str, Any]) -> None:
            if node.get("type") == "COURSE":
                course = node.get("course")
                if course and course not in courses:
                    courses.append(course)
            elif "children" in node:
                for child in node["children"]:
                    traverse(child)
        
        traverse(tree)
        return courses
    
    def tree_to_string(self, tree: Optional[dict[str, Any]]) -> str:
        """
        Convert a prerequisite tree back to a human-readable string.
        
        Args:
            tree: The prerequisite tree structure
            
        Returns:
            Human-readable prerequisite string
        """
        if not tree:
            return ""
        
        node_type = tree.get("type")
        
        if node_type == "COURSE":
            return tree.get("course", "")
        
        elif node_type in ("AND", "OR"):
            children = tree.get("children", [])
            child_strings = [self.tree_to_string(child) for child in children]
            operator = " and " if node_type == "AND" else " or "
            
            # Add parentheses if nested
            formatted_children = []
            for i, (child, child_str) in enumerate(zip(children, child_strings)):
                if child.get("type") in ("AND", "OR") and child.get("type") != node_type:
                    formatted_children.append(f"({child_str})")
                else:
                    formatted_children.append(child_str)
            
            return operator.join(formatted_children)
        
        elif node_type == "UNKNOWN":
            return tree.get("expression", "")
        
        return ""
