-- Secondary index supporting CVE-mode corroboration across partial CVE sets.
-- When sources A and B cover the same disclosure but A extracts [CVE-X] and B
-- extracts [CVE-X, CVE-Y], hashing the full set produces different incident
-- IDs. This table maps each individual CVE+bucket pair to the canonical
-- incident ID so any overlapping CVE unambiguously resolves to the same
-- incident.
CREATE TABLE IF NOT EXISTS incident_cve_index (
  cve_id      TEXT    NOT NULL,
  bucket      INTEGER NOT NULL,
  incident_id TEXT    NOT NULL REFERENCES incidents(id),
  PRIMARY KEY (cve_id, bucket)
);
