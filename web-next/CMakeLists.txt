# CMakeLists.txt for ZoneMinder Next-Gen Web UI
# Builds the Vue 3 SPA and installs to the web directory

find_program(NPM_EXECUTABLE npm)

if(NPM_EXECUTABLE)
  # Install dependencies and build the SPA
  add_custom_target(web-next ALL
    COMMAND ${NPM_EXECUTABLE} install --no-audit --no-fund
    COMMAND ${NPM_EXECUTABLE} run build
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    COMMENT "Building ZoneMinder Next-Gen Web UI"
  )

  # Install built assets
  install(DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/dist/
    DESTINATION "${ZM_WEBDIR}/../web-next"
    PATTERN "*.map" EXCLUDE
  )
else()
  message(WARNING "npm not found — skipping web-next build. Install Node.js to build the Next-Gen Web UI.")
endif()
