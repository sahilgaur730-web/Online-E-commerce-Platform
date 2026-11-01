#!/bin/sh
DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -z "${MAVEN_ARGS-}" ]; then
  export MAVEN_ARGS="-f backend/pom.xml"
else
  case "$MAVEN_ARGS" in
    *backend/pom.xml*) ;;
    *) export MAVEN_ARGS="-f backend/pom.xml $MAVEN_ARGS" ;;
  esac
fi
exec "$DIR/backend/mvnw" "$@"
