class DetectionPipeline:

    async def process_frame(
        self,
        frame
    ):

        return {
            "integrity_score": 97,
            "face_detected": True,
            "multiple_person": False
        }