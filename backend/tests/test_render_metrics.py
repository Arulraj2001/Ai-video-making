from app.services.render_service import render_service


def test_render_failure_classification():
    assert render_service._classify_render_failure(RuntimeError("FFmpeg failed")) == "ffmpeg_failed"
    assert render_service._classify_render_failure(RuntimeError("upload to storage failed")) == "durable_storage_failed"
    assert render_service._classify_render_failure(RuntimeError("Rendered output failed validation")) == "output_validation_failed"


def test_render_job_exposes_operational_metrics():
    from app.models.render import RenderJobModel

    job = RenderJobModel(
        queue_wait_seconds=1.25,
        render_duration_seconds=4.5,
        upload_duration_seconds=0.8,
        scene_count=3,
        output_size_bytes=1024,
        failure_code="render_failed",
    )

    assert job.scene_count == 3
    assert job.output_size_bytes == 1024
    assert job.failure_code == "render_failed"
